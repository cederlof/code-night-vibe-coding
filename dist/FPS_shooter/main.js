import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ROUND_DURATION_MS = 15_000;
const MISS_PENALTY = -5;
const BEST_SCORE_KEY = 'clickReflex.bestScore.v2';

// Scoring tiers
const HIT_BASE_POINTS = 10;
const RT_FAST_THRESHOLD_MS = 230;
const RT_OK_THRESHOLD_MS = 520;
const RT_FAST_BONUS = 14;
const RT_OK_BONUS = 6;
const RT_SLOW_BONUS = 0;

// 3D feel
const WORLD_UNITS_PER_PX = 0.01;
const SAFE_MARGIN_PX = 54; // keeps targets away from edges

// Juice
const HIT_STOP_MS = 70;
const SHAKE_DECAY = 0.88;

// Miss fairness
const MISCLICK_COOLDOWN_MS = 140;
const NEAR_MISS_FORGIVENESS_MULT = 1.9; // within ~2x radius => no miss
const HITBOX_SCALE = 1.35; // aim assist

/** @typedef {'standard'|'smallFast'|'tank'|'runner'|'shrinker'|'decoy'} TargetKind */

/**
 * @typedef ActiveTarget
 * @property {TargetKind} kind
 * @property {THREE.Object3D} root
 * @property {THREE.Mesh} mesh
 * @property {THREE.Mesh} hitbox
 * @property {number} spawnTimeMs
 * @property {number} lifetimeMs
 * @property {number} hitsRemaining
 * @property {{ x: number, z: number }} base
 * @property {{ ox: number, oz: number, tox: number, toz: number, nextAtMs: number }} wobble
 * @property {{ angle: number, radius: number } | null} runner
 */

const playfield = /** @type {HTMLElement} */ (document.getElementById('playfield'));
const sceneHost = /** @type {HTMLElement} */ (document.getElementById('scene'));
const versionEl = document.getElementById('version');

const timeRemainingEl = document.getElementById('timeRemaining');
const scoreEl = document.getElementById('score');
const hitsEl = document.getElementById('hits');
const missesEl = document.getElementById('misses');
const accuracyEl = document.getElementById('accuracy');

const startBtn = /** @type {HTMLButtonElement} */ (document.getElementById('startBtn'));
const overlay = /** @type {HTMLElement} */ (document.getElementById('overlay'));
const overlayText = document.getElementById('overlayText');
const restartBtn = /** @type {HTMLButtonElement} */ (document.getElementById('restartBtn'));

const resultsDl = /** @type {HTMLElement} */ (document.getElementById('results'));
const resultsNote = document.getElementById('resultsNote');
const resultScoreEl = document.getElementById('resultScore');
const resultHitsEl = document.getElementById('resultHits');
const resultMissesEl = document.getElementById('resultMisses');
const resultAccuracyEl = document.getElementById('resultAccuracy');
const resultReflexAgeEl = document.getElementById('resultReflexAge');
const bestScoreEl = document.getElementById('bestScore');

/** @type {number | null} */
let roundEndsAtMs = null;
/** @type {number | null} */
let rafId = null;
/** @type {ActiveTarget | null} */
let activeTarget = null;

let hits = 0;
let misses = 0;
let score = 0;
let bestScore = 0;
/** @type {number[]} */
let reactionTimesMs = [];

/** @type {AudioContext | null} */
let audioCtx = null;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatLocalDateTime(d) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

async function getLastModified(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const header = res.headers.get('Last-Modified');
    if (!header) return null;
    const ms = Date.parse(header);
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

async function updateVersionLabel() {
  if (!versionEl) return;

  // Fallback: document.lastModified (often index.html)
  let bestMs = Date.parse(document.lastModified);
  if (!Number.isFinite(bestMs)) bestMs = Date.now();

  // Try to find the latest modified time across core assets.
  const [htmlMs, jsMs, cssMs] = await Promise.all([
    getLastModified('./'),
    getLastModified('./main.js'),
    getLastModified('./styles.css'),
  ]);

  for (const ms of [htmlMs, jsMs, cssMs]) {
    if (ms != null && ms > bestMs) bestMs = ms;
  }

  versionEl.textContent = `v ${formatLocalDateTime(new Date(bestMs))}`;
}

// --- Three.js setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.85, 0.6, 0.2);
composer.addPass(bloomPass);

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const clickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clickWorld = new THREE.Vector3();

let worldW = 6;
let worldH = 4;
let safeMarginWorld = SAFE_MARGIN_PX * WORLD_UNITS_PER_PX;
let hitStopUntilMs = 0;
let shakeMag = 0;
let lastMisclickAtMs = -Infinity;

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
keyLight.position.set(2, 5, 2);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
fillLight.position.set(-3, 3, -2);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.9, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
scene.add(ground);

const grid = new THREE.GridHelper(20, 24, 0x2a2d3a, 0x1c1f2a);
grid.position.y = -0.14;
scene.add(grid);

class ParticlePool {
  /**
   * @param {number} max
   */
  constructor(max) {
    this.max = max;
    this.count = 0;

    this.positions = new Float32Array(max * 3);
    this.velocities = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);
    this.lives = new Float32Array(max);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 6 * WORLD_UNITS_PER_PX,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geom, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  /**
   * @param {THREE.Vector3} pos
   * @param {number} amount
   * @param {{r:number,g:number,b:number}} color
   */
  burst(pos, amount, color) {
    for (let i = 0; i < amount; i += 1) {
      const idx = this.count % this.max;
      this.count += 1;

      const p = idx * 3;
      this.positions[p] = pos.x;
      this.positions[p + 1] = pos.y;
      this.positions[p + 2] = pos.z;

      const theta = Math.random() * Math.PI * 2;
      const up = 0.4 + Math.random() * 1.1;
      const speed = 1.2 + Math.random() * 2.0;
      this.velocities[p] = Math.cos(theta) * speed;
      this.velocities[p + 1] = up * speed;
      this.velocities[p + 2] = Math.sin(theta) * speed;

      this.colors[p] = color.r;
      this.colors[p + 1] = color.g;
      this.colors[p + 2] = color.b;

      this.lives[idx] = 0.45 + Math.random() * 0.35;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    const gravity = -6.5;
    const n = Math.min(this.count, this.max);
    for (let idx = 0; idx < n; idx += 1) {
      const life = this.lives[idx];
      if (life <= 0) continue;

      const p = idx * 3;
      this.velocities[p + 1] += gravity * dt;

      this.positions[p] += this.velocities[p] * dt;
      this.positions[p + 1] += this.velocities[p + 1] * dt;
      this.positions[p + 2] += this.velocities[p + 2] * dt;

      this.lives[idx] = life - dt;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

const particles = new ParticlePool(1800);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setOverlayVisible(visible) {
  if (visible) overlay.removeAttribute('hidden');
  else overlay.setAttribute('hidden', '');
}

function loadBestScore() {
  const raw = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsed = raw == null ? null : Number(raw);
  bestScore = Number.isFinite(parsed) ? parsed : 0;
  bestScoreEl.textContent = String(bestScore);
}

function saveBestScoreIfNeeded() {
  if (score > bestScore) {
    bestScore = score;
    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  }
  bestScoreEl.textContent = String(bestScore);
}

function getAccuracyPercent() {
  const total = hits + misses;
  if (total <= 0) return 0;
  return Math.round((hits / total) * 100);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeReflexAgeEstimate() {
  // Important: this is NOT validated or scientific.
  // It's a transparent, consistent heuristic so the game can show a fun "age" proxy.
  const med = median(reactionTimesMs);
  const total = hits + misses;
  if (med == null || total <= 0) return null;

  const accuracy = hits / total; // 0..1

  // Reflex score: higher is better (0..100)
  // - Median RT dominates.
  // - Inaccuracy strongly penalized.
  // These constants are tuned for gameplay feel, not science.
  const rtPenalty = (med - 220) / 7.0; // med=220ms => ~0 penalty
  const accPenalty = (1 - accuracy) * 75;
  const reflexScore = clamp(100 - rtPenalty - accPenalty, 0, 100);

  // Map reflex score to an "age" range.
  // Score 100 => ~18, score 0 => ~78
  const age = 18 + (100 - reflexScore) * 0.6;
  return Math.round(clamp(age, 10, 90));
}

function updateHud() {
  scoreEl.textContent = String(score);
  hitsEl.textContent = String(hits);
  missesEl.textContent = String(misses);
  accuracyEl.textContent = String(getAccuracyPercent());
}

function updateTimeRemaining(nowMs) {
  if (roundEndsAtMs == null) return;
  const remainingMs = Math.max(0, roundEndsAtMs - nowMs);
  timeRemainingEl.textContent = (remainingMs / 1000).toFixed(1);
}

function isRoundRunning() {
  return roundEndsAtMs != null;
}

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

/** @param {number} value */
function dbToGain(value) {
  return Math.pow(10, value / 20);
}

/**
 * @param {'hitFast'|'hitOk'|'hitSlow'|'miss'} kind
 */
function playSound(kind) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;

  // Click transient (noise)
  const bufferSize = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(dbToGain(kind === 'miss' ? -18 : -22), now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);

  // Tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq =
    kind === 'hitFast' ? 1040 : kind === 'hitOk' ? 820 : kind === 'hitSlow' ? 660 : 220;
  osc.type = kind === 'miss' ? 'square' : 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(dbToGain(kind === 'miss' ? -10 : -12), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'miss' ? 0.14 : 0.11));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (kind === 'miss' ? 0.16 : 0.12));
}

function addPopup(text, x, y, isPositive) {
  const el = document.createElement('div');
  el.className = `popup ${isPositive ? 'popup--pos' : 'popup--neg'}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  playfield.appendChild(el);
  window.setTimeout(() => el.remove(), 700);
}

function addRing(x, y, sizePx) {
  const el = document.createElement('div');
  el.className = 'effect-ring';
  el.style.width = `${sizePx}px`;
  el.style.height = `${sizePx}px`;
  const radius = sizePx / 2;
  el.style.left = `${x - radius}px`;
  el.style.top = `${y - radius}px`;
  playfield.appendChild(el);
  window.setTimeout(() => el.remove(), 250);
}

/**
 * @param {THREE.Vector3} worldPos
 */
function worldToPlayfieldPx(worldPos) {
  const rect = playfield.getBoundingClientRect();
  const v = worldPos.clone().project(camera);
  const x = (v.x * 0.5 + 0.5) * rect.width;
  const y = (-v.y * 0.5 + 0.5) * rect.height;
  return { x, y };
}

function getHitPoints(reactionTimeMs) {
  let bonus = RT_SLOW_BONUS;
  if (reactionTimeMs <= RT_FAST_THRESHOLD_MS) bonus = RT_FAST_BONUS;
  else if (reactionTimeMs <= RT_OK_THRESHOLD_MS) bonus = RT_OK_BONUS;
  return HIT_BASE_POINTS + bonus;
}

/**
 * @param {number} nowMs
 */
function getSpawnWeights(nowMs) {
  const remainingMs = roundEndsAtMs == null ? ROUND_DURATION_MS : Math.max(0, roundEndsAtMs - nowMs);

  // Late-game: more high-reward / movement targets.
  const late = remainingMs <= 5000;
  return late
    ? [
        ['standard', 16],
        ['runner', 14],
        ['smallFast', 16],
        ['tank', 7],
        ['shrinker', 10],
        ['decoy', 2],
      ]
    : [
        ['standard', 26],
        ['runner', 8],
        ['smallFast', 8],
        ['tank', 6],
        ['shrinker', 7],
        ['decoy', 1],
      ];
}

/**
 * @param {Array<[TargetKind, number]>} weights
 * @returns {TargetKind}
 */
function pickWeighted(weights) {
  let sum = 0;
  for (const [, w] of weights) sum += w;
  let r = Math.random() * sum;
  for (const [k, w] of weights) {
    r -= w;
    if (r <= 0) return k;
  }
  return weights[0][0];
}

function clearActiveTarget() {
  if (!activeTarget) return;
  scene.remove(activeTarget.root);
  activeTarget = null;
}

/**
 * @param {TargetKind} kind
 */
function createTarget(kind) {
  const root = new THREE.Group();
  root.position.y = 0.22;

  /** @type {THREE.BufferGeometry} */
  let geom;
  /** @type {THREE.MeshStandardMaterial} */
  let mat;
  let baseScale = 1;
  let lifetimeMs = 900;
  let hitsRemaining = 1;
  /** @type {{angle:number,radius:number} | null} */
  let runner = null;

  switch (kind) {
    case 'smallFast':
      geom = new THREE.IcosahedronGeometry(0.18, 0);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7cffd6, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.4 });
      baseScale = 0.9;
      lifetimeMs = 700 + Math.random() * 650;
      break;
    case 'tank':
      geom = new THREE.SphereGeometry(0.28, 24, 16);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd17c, emissiveIntensity: 1.0, roughness: 0.35, metalness: 0.35 });
      baseScale = 1.15;
      lifetimeMs = 1400 + Math.random() * 900;
      hitsRemaining = 3;
      break;
    case 'runner':
      geom = new THREE.TorusGeometry(0.22, 0.08, 10, 22);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7ca7ff, emissiveIntensity: 1.25, roughness: 0.25, metalness: 0.25 });
      baseScale = 1.0;
      lifetimeMs = 900 + Math.random() * 900;
      runner = { angle: Math.random() * Math.PI * 2, radius: 0.55 + Math.random() * 0.35 };
      break;
    case 'shrinker':
      geom = new THREE.OctahedronGeometry(0.32, 0);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xb37cff, emissiveIntensity: 1.05, roughness: 0.25, metalness: 0.35 });
      baseScale = 1.2;
      lifetimeMs = 850 + Math.random() * 850;
      break;
    case 'decoy':
      geom = new THREE.TetrahedronGeometry(0.26, 0);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff4d4d, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.15 });
      baseScale = 1.05;
      lifetimeMs = 950 + Math.random() * 750;
      break;
    case 'standard':
    default:
      geom = new THREE.SphereGeometry(0.26, 22, 16);
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4de1ff, emissiveIntensity: 1.1, roughness: 0.3, metalness: 0.25 });
      baseScale = 1.0;
        lifetimeMs = 850 + Math.random() * 950;
      break;
  }

  const mesh = new THREE.Mesh(geom, mat);
  mesh.userData.clickable = true;
  root.add(mesh);
  root.scale.setScalar(baseScale);

  // Invisible hitbox for forgiving clicks (aim assist)
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
  );
  hitbox.scale.setScalar(HITBOX_SCALE);
  hitbox.userData.clickable = true;
  root.add(hitbox);

  // Subtle inner glow
  const glow = new THREE.PointLight(mat.emissive.getHex(), 0.7, 2.2);
  glow.position.set(0, 0.2, 0);
  root.add(glow);

  return { root, mesh, hitbox, lifetimeMs, hitsRemaining, runner };
}

function pickSpawnXZ() {
  const minX = -worldW / 2 + safeMarginWorld;
  const maxX = worldW / 2 - safeMarginWorld;
  const minZ = -worldH / 2 + safeMarginWorld;
  const maxZ = worldH / 2 - safeMarginWorld;

  return {
    x: clamp((Math.random() * 2 - 1) * (worldW / 2), minX, maxX),
    z: clamp((Math.random() * 2 - 1) * (worldH / 2), minZ, maxZ),
  };
}

/**
 * @param {number} nowMs
 */
function spawnTarget(nowMs) {
  if (!isRoundRunning()) return;
  clearActiveTarget();

  const kind = pickWeighted(getSpawnWeights(nowMs));
  const { root, mesh, hitbox, lifetimeMs, hitsRemaining, runner } = createTarget(kind);
  const base = pickSpawnXZ();

  root.position.x = base.x;
  root.position.z = base.z;

  scene.add(root);

  const wobbleRadius = 1.0 * 0.22; // ~1x radius
  activeTarget = {
    kind,
    root,
    mesh,
    hitbox,
    spawnTimeMs: nowMs,
    lifetimeMs,
    hitsRemaining,
    base,
    wobble: { ox: 0, oz: 0, tox: 0, toz: 0, nextAtMs: nowMs + 150 },
    runner,
  };
}

function applyMiss(worldPos, reason) {
  misses += 1;
  score += MISS_PENALTY;
  updateHud();

  const { x, y } = worldToPlayfieldPx(worldPos);
  addPopup(String(MISS_PENALTY), x, y, false);
  addRing(x, y, 56);

  particles.burst(worldPos, 22, { r: 1.0, g: 0.35, b: 0.35 });
  playSound('miss');
  shakeMag = Math.min(0.45, shakeMag + 0.22);
}

/**
 * @param {THREE.Vector3} worldPos
 * @param {number} reactionTimeMs
 */
function applyHit(worldPos, reactionTimeMs) {
  if (!activeTarget) return;

  reactionTimesMs.push(reactionTimeMs);

  const pointsBase = getHitPoints(reactionTimeMs);

  // Target type modifiers
  let points = pointsBase;
  if (activeTarget.kind === 'smallFast') points += 8;
  if (activeTarget.kind === 'runner') points += 6;
  if (activeTarget.kind === 'shrinker') {
    const t = clamp(reactionTimeMs / activeTarget.lifetimeMs, 0, 1);
    points += Math.round(12 * t); // later click = more points
  }
  if (activeTarget.kind === 'decoy') points = -12;

  if (activeTarget.kind === 'tank') {
    activeTarget.hitsRemaining -= 1;
    // Micro-reward per hit, big on final
    points = activeTarget.hitsRemaining <= 0 ? pointsBase + 22 : 6;
  }

  hits += 1;
  score += points;
  updateHud();

  const { x, y } = worldToPlayfieldPx(worldPos);
  addPopup(points >= 0 ? `+${points}` : String(points), x, y, points >= 0);
  addRing(x, y, 64);

  particles.burst(worldPos, 30, points >= 0 ? { r: 0.35, g: 0.95, b: 1.0 } : { r: 1.0, g: 0.35, b: 0.35 });

  const tier =
    reactionTimeMs <= RT_FAST_THRESHOLD_MS
      ? 'hitFast'
      : reactionTimeMs <= RT_OK_THRESHOLD_MS
        ? 'hitOk'
        : 'hitSlow';
  playSound(tier);

  hitStopUntilMs = performance.now() + HIT_STOP_MS;

  // Tank takes multiple hits.
  if (activeTarget.kind === 'tank' && activeTarget.hitsRemaining > 0) {
    const mat = /** @type {THREE.MeshStandardMaterial} */ (activeTarget.mesh.material);
    mat.emissiveIntensity = 0.7 + 0.15 * activeTarget.hitsRemaining;
    activeTarget.root.scale.setScalar(activeTarget.root.scale.x * 0.92);
    return;
  }
}

function endRound() {
  roundEndsAtMs = null;
  clearActiveTarget();
  saveBestScoreIfNeeded();

  resultsDl.removeAttribute('hidden');
  resultScoreEl.textContent = String(score);
  resultHitsEl.textContent = String(hits);
  resultMissesEl.textContent = String(misses);
  resultAccuracyEl.textContent = String(getAccuracyPercent());

  const reflexAge = computeReflexAgeEstimate();
  if (resultReflexAgeEl) {
    resultReflexAgeEl.textContent = reflexAge == null ? '—' : `${reflexAge}`;
  }
  if (resultsNote) {
    if (reflexAge == null) resultsNote.setAttribute('hidden', '');
    else resultsNote.removeAttribute('hidden');
  }

  overlayText.textContent = 'Round complete.';
  restartBtn.textContent = 'Restart';
  setOverlayVisible(true);
  startBtn.disabled = false;
}

function resetRound() {
  hits = 0;
  misses = 0;
  score = 0;
  reactionTimesMs = [];
  updateHud();
  timeRemainingEl.textContent = (ROUND_DURATION_MS / 1000).toFixed(1);
  clearActiveTarget();
}

function startRound() {
  resetRound();

  const nowMs = performance.now();
  roundEndsAtMs = nowMs + ROUND_DURATION_MS;

  setOverlayVisible(false);
  resultsDl.setAttribute('hidden', '');
  startBtn.disabled = true;

  spawnTarget(nowMs);

  if (rafId != null) cancelAnimationFrame(rafId);
  lastFrameMs = nowMs;
  rafId = requestAnimationFrame(tick);
}

startBtn.addEventListener('click', () => {
  if (isRoundRunning()) return;
  startRound();
});

restartBtn.addEventListener('click', () => {
  if (isRoundRunning()) return;
  startRound();
});

/** @type {number} */
let lastFrameMs = performance.now();

function updateTarget(nowMs, dt) {
  if (!activeTarget) return;

  // Timeout miss
  if (nowMs - activeTarget.spawnTimeMs >= activeTarget.lifetimeMs) {
    const p = new THREE.Vector3(activeTarget.root.position.x, activeTarget.root.position.y, activeTarget.root.position.z);
    applyMiss(p, 'timeout');
    spawnTarget(nowMs);
    return;
  }

  if (nowMs < hitStopUntilMs) return;

  // Wobble target
  if (nowMs >= activeTarget.wobble.nextAtMs) {
    activeTarget.wobble.tox = (Math.random() * 2 - 1) * 0.22;
    activeTarget.wobble.toz = (Math.random() * 2 - 1) * 0.22;
    activeTarget.wobble.nextAtMs = nowMs + 140 + Math.random() * 120;
  }

  activeTarget.wobble.ox += (activeTarget.wobble.tox - activeTarget.wobble.ox) * 0.08;
  activeTarget.wobble.oz += (activeTarget.wobble.toz - activeTarget.wobble.oz) * 0.08;

  let x = activeTarget.base.x + activeTarget.wobble.ox;
  let z = activeTarget.base.z + activeTarget.wobble.oz;

  // Runner movement
  if (activeTarget.runner) {
    activeTarget.runner.angle += dt * (1.85 + Math.random() * 0.2);
    x += Math.cos(activeTarget.runner.angle) * activeTarget.runner.radius;
    z += Math.sin(activeTarget.runner.angle) * activeTarget.runner.radius;
  }

  // Shrinker
  if (activeTarget.kind === 'shrinker') {
    const t = clamp((nowMs - activeTarget.spawnTimeMs) / activeTarget.lifetimeMs, 0, 1);
    const s = 1.25 - 0.75 * t;
    activeTarget.root.scale.setScalar(s);
  }

  const minX = -worldW / 2 + safeMarginWorld;
  const maxX = worldW / 2 - safeMarginWorld;
  const minZ = -worldH / 2 + safeMarginWorld;
  const maxZ = worldH / 2 - safeMarginWorld;

  activeTarget.root.position.x = clamp(x, minX, maxX);
  activeTarget.root.position.z = clamp(z, minZ, maxZ);

  // Subtle rotation
  activeTarget.root.rotation.y += dt * 1.4;
  activeTarget.mesh.rotation.x += dt * 0.9;
}

function resize() {
  const rect = playfield.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);

  worldW = w * WORLD_UNITS_PER_PX;
  worldH = h * WORLD_UNITS_PER_PX;
  safeMarginWorld = SAFE_MARGIN_PX * WORLD_UNITS_PER_PX;

  camera.left = -worldW / 2;
  camera.right = worldW / 2;
  camera.top = worldH / 2;
  camera.bottom = -worldH / 2;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(() => resize());
resizeObserver.observe(playfield);
resize();

function onPointerDown(event) {
  if (!isRoundRunning()) return;
  if (overlay.getAttribute('hidden') == null) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  pointerNdc.x = x * 2 - 1;
  pointerNdc.y = -(y * 2 - 1);

  raycaster.setFromCamera(pointerNdc, camera);

  // Hit test
  if (activeTarget) {
    const hits3d = raycaster.intersectObject(activeTarget.hitbox, true);
    if (hits3d.length > 0) {
      const nowMs = performance.now();
      const reaction = nowMs - activeTarget.spawnTimeMs;

      const p = hits3d[0].point.clone();
      applyHit(p, reaction);

      // If target destroyed, spawn a new one immediately.
      if (!activeTarget || activeTarget.kind !== 'tank' || activeTarget.hitsRemaining <= 0) {
        spawnTarget(nowMs);
      }
      return;
    }
  }

  // Misclick fairness: cooldown + near-miss forgiveness
  const nowMs = performance.now();
  if (nowMs - lastMisclickAtMs < MISCLICK_COOLDOWN_MS) return;

  // Miss: project onto plane
  if (raycaster.ray.intersectPlane(clickPlane, clickWorld)) {
    if (activeTarget) {
      const dx = clickWorld.x - activeTarget.root.position.x;
      const dz = clickWorld.z - activeTarget.root.position.z;
      const dist = Math.hypot(dx, dz);
      const forgivingRadius = 0.32 * HITBOX_SCALE * NEAR_MISS_FORGIVENESS_MULT;
      if (dist <= forgivingRadius) {
        const p = worldToPlayfieldPx(activeTarget.root.position);
        addPopup('Close!', p.x, p.y, true);
        playSound('hitSlow');
        return;
      }
    }

    lastMisclickAtMs = nowMs;
    applyMiss(clickWorld.clone(), 'misclick');
  }
}

renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });

function tick(nowMs) {
  updateTimeRemaining(nowMs);

  if (!isRoundRunning()) return;
  if (roundEndsAtMs != null && nowMs >= roundEndsAtMs) {
    endRound();
    return;
  }

  const dt = Math.min(0.033, (nowMs - lastFrameMs) / 1000);
  lastFrameMs = nowMs;

  if (nowMs >= hitStopUntilMs) {
    updateTarget(nowMs, dt);
    particles.update(dt);
  } else {
    // still let particles fall a tiny bit to avoid a full freeze
    particles.update(dt * 0.35);
  }

  // Camera shake
  shakeMag *= SHAKE_DECAY;
  const shakeX = (Math.random() * 2 - 1) * shakeMag;
  const shakeZ = (Math.random() * 2 - 1) * shakeMag;
  camera.position.x = shakeX;
  camera.position.z = 10 + shakeZ;
  camera.lookAt(0, 0, 0);

  // Slight ground drift to feel alive
  grid.rotation.y += dt * 0.15;

  composer.render();

  rafId = requestAnimationFrame(tick);
}

// Initial overlay state
setOverlayVisible(true);
resetRound();
loadBestScore();
updateVersionLabel();
window.setTimeout(updateVersionLabel, 500);
