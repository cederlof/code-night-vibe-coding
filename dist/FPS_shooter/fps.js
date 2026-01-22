import * as THREE from 'three';

// ----------------------
// Version label (uses latest Last-Modified of core files)
// ----------------------
const versionEl = document.getElementById('version');

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

  let bestMs = Date.parse(document.lastModified);
  if (!Number.isFinite(bestMs)) bestMs = Date.now();

  const [htmlMs, jsMs, cssMs] = await Promise.all([
    getLastModified('./'),
    getLastModified('./fps.js'),
    getLastModified('./styles.css'),
  ]);

  for (const ms of [htmlMs, jsMs, cssMs]) {
    if (ms != null && ms > bestMs) bestMs = ms;
  }

  versionEl.textContent = `v ${formatLocalDateTime(new Date(bestMs))}`;
}

updateVersionLabel();
window.setTimeout(updateVersionLabel, 500);

// ----------------------
// DOM
// ----------------------
const playfield = /** @type {HTMLElement} */ (document.getElementById('playfield'));
const sceneHost = /** @type {HTMLElement} */ (document.getElementById('scene'));
const overlay = /** @type {HTMLElement} */ (document.getElementById('overlay'));
const overlayText = /** @type {HTMLElement} */ (document.getElementById('overlayText'));
const startBtn = /** @type {HTMLButtonElement} */ (document.getElementById('startBtn'));
const weaponForm = /** @type {HTMLFormElement} */ (document.getElementById('weaponForm'));
const damageEl = /** @type {HTMLElement} */ (document.getElementById('damage'));

const playerHpFill = /** @type {HTMLElement} */ (document.getElementById('playerHpFill'));
const playerHpText = /** @type {HTMLElement} */ (document.getElementById('playerHpText'));
const weaponNameEl = /** @type {HTMLElement} */ (document.getElementById('weaponName'));
const levelEl = /** @type {HTMLElement} */ (document.getElementById('level'));
const ammoEl = /** @type {HTMLElement} */ (document.getElementById('ammo'));
const killsEl = /** @type {HTMLElement} */ (document.getElementById('kills'));

const resultsDl = /** @type {HTMLElement} */ (document.getElementById('results'));
const resultKillsEl = /** @type {HTMLElement} */ (document.getElementById('resultKills'));
const resultTimeEl = /** @type {HTMLElement} */ (document.getElementById('resultTime'));

function setOverlayVisible(visible) {
  if (visible) overlay.removeAttribute('hidden');
  else overlay.setAttribute('hidden', '');
}

// ----------------------
// Audio
// ----------------------
/** @type {AudioContext | null} */
let audioCtx = null;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function playTone({ freq = 660, type = 'sine', dur = 0.1, gainDb = -14, sweepTo = null } = {}) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweepTo != null) {
    osc.frequency.exponentialRampToValueAtTime(sweepTo, now + dur);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(dbToGain(gainDb), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function playNoiseClick({ dur = 0.03, gainDb = -24 } = {}) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(dbToGain(gainDb), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
}

function playEnemyHurtSound(typeKey) {
  // Simple "suffering" sound: noisy click + downward sweep
  const base = typeKey === 'brute' ? 170 : typeKey === 'sniper' ? 260 : 320;
  playNoiseClick({ dur: 0.02, gainDb: -26 });
  playTone({ freq: base + randBetween(-40, 40), type: 'sawtooth', dur: 0.06, gainDb: -18, sweepTo: base * 0.6 });
}

function playDryFire() {
  playNoiseClick({ dur: 0.016, gainDb: -28 });
  playTone({ freq: 140, type: 'square', dur: 0.03, gainDb: -24, sweepTo: 110 });
}

function playLevelClearSound() {
  playNoiseClick({ dur: 0.02, gainDb: -26 });
  playTone({ freq: 520, type: 'sine', dur: 0.08, gainDb: -18, sweepTo: 780 });
  window.setTimeout(() => playTone({ freq: 660, type: 'sine', dur: 0.08, gainDb: -18, sweepTo: 980 }), 70);
  window.setTimeout(() => playTone({ freq: 880, type: 'sine', dur: 0.1, gainDb: -16, sweepTo: 1320 }), 140);
}

function playBossSpawnSound() {
  playTone({ freq: 90, type: 'sawtooth', dur: 0.18, gainDb: -16, sweepTo: 55 });
  window.setTimeout(() => playTone({ freq: 110, type: 'square', dur: 0.12, gainDb: -18, sweepTo: 70 }), 70);
}

// ----------------------
// Voice (no external assets)
// ----------------------
let lastOhNoMs = 0;

function screamOhNo() {
  const now = performance.now();
  if (now - lastOhNoMs < 220) return;
  lastOhNoMs = now;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Avoid a long backlog if lots of enemies die quickly.
    if (synth.speaking || synth.pending) synth.cancel();

    const u = new SpeechSynthesisUtterance('Oh no');
    u.rate = 1.05;
    u.pitch = 1.25 + Math.random() * 0.45;
    u.volume = 1;
    synth.speak(u);
  } catch {
    // Ignore: speech synthesis can be blocked by browser policies.
  }
}

// ----------------------
// Game config
// ----------------------
const ARENA_RADIUS = 18;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.45;
const PLAYER_SPEED = 6.2;
const PLAYER_SPRINT = 1.35;
const MOUSE_SENS = 0.0022;

const MAX_ENEMIES = 10;
const SPAWN_INTERVAL_MS = 900;

const PLAYER_MAX_HP = 200;

const PLAYER_TRACER_COLOR = 0xbffcff;
const ENEMY_TRACER_COLOR = 0xff5c8a;
const TRACER_LIFETIME_MS = 65;

const WEAPONS = {
  pistol: {
    name: 'Pistol',
    fireMode: 'semi',
    cooldownMs: 220,
    damage: 18,
    pellets: 1,
    spread: 0.006,
    range: 55,
    startAmmo: 24,
  },
  rifle: {
    name: 'Rifle',
    fireMode: 'auto',
    cooldownMs: 85,
    damage: 8,
    pellets: 1,
    spread: 0.012,
    range: 65,
    startAmmo: 60,
  },
  shotgun: {
    name: 'Shotgun',
    fireMode: 'semi',
    cooldownMs: 650,
    damage: 8,
    pellets: 8,
    spread: 0.06,
    range: 28,
    startAmmo: 12,
  },
};

const ENEMY_TYPES = {
  drone: {
    name: 'Drone',
    hp: 26,
    speed: 3.0,
    radius: 0.55,
    fire: { cooldownMs: 700, projectileSpeed: 12, damage: 6, burst: 1 },
    color: 0x7cffd6,
    geom: 'icosa',
  },
  brute: {
    name: 'Brute',
    hp: 70,
    speed: 1.6,
    radius: 0.95,
    fire: { cooldownMs: 1050, projectileSpeed: 10, damage: 10, burst: 2 },
    color: 0xffd17c,
    geom: 'box',
  },
  sniper: {
    name: 'Sniper',
    hp: 40,
    speed: 2.1,
    radius: 0.7,
    fire: { cooldownMs: 1500, projectileSpeed: 18, damage: 18, burst: 1 },
    color: 0x7ca7ff,
    geom: 'octa',
  },
  boss: {
    name: 'Boss',
    hp: 220,
    speed: 1.25,
    radius: 1.7,
    fire: { cooldownMs: 520, projectileSpeed: 14, damage: 14, burst: 3 },
    color: 0xff4d7c,
    geom: 'icosa',
  },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

function pickEnemyType() {
  const r = Math.random();
  if (r < 0.55) return 'drone';
  if (r < 0.82) return 'sniper';
  return 'brute';
}

// ----------------------
// Three.js setup
// ----------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0c10, 10, 65);

const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);

const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.add(pitch);
pitch.add(camera);
scene.add(yaw);

// Simple first-person viewmodel (gun)
const viewModel = new THREE.Group();
viewModel.position.set(0.26, -0.22, -0.6);
camera.add(viewModel);

const vmMat = new THREE.MeshStandardMaterial({ color: 0x10131b, roughness: 0.55, metalness: 0.35 });
const vmAccent = new THREE.MeshStandardMaterial({ color: 0x20283a, roughness: 0.45, metalness: 0.55 });

const vmBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.34), vmMat);
vmBody.position.set(0.02, -0.02, 0.0);
viewModel.add(vmBody);

const vmBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.34), vmAccent);
vmBarrel.position.set(0.02, 0.03, -0.22);
viewModel.add(vmBarrel);

const vmGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.12), vmAccent);
vmGrip.position.set(-0.03, -0.1, 0.1);
vmGrip.rotation.x = 0.25;
viewModel.add(vmGrip);

scene.add(new THREE.HemisphereLight(0xcbd5ff, 0x222233, 0.8));

const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(6, 12, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-8, 8, -6);
scene.add(fill);

const arena = new THREE.Group();
scene.add(arena);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(ARENA_RADIUS, 48),
  new THREE.MeshStandardMaterial({ color: 0x0f1118, roughness: 0.95, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
arena.add(ground);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(ARENA_RADIUS - 0.2, ARENA_RADIUS, 64),
  new THREE.MeshStandardMaterial({ color: 0x1c2030, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.01;
arena.add(ring);

const wall = new THREE.Mesh(
  new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, 4.2, 64, 1, true),
  new THREE.MeshStandardMaterial({ color: 0x141827, roughness: 0.95, metalness: 0.08, side: THREE.BackSide })
);
wall.position.y = 2.1;
arena.add(wall);

for (let i = 0; i < 10; i += 1) {
  const p = (i / 10) * Math.PI * 2;
  const light = new THREE.PointLight(0x4de1ff, 0.35, 10);
  light.position.set(Math.cos(p) * (ARENA_RADIUS - 2), 2.2, Math.sin(p) * (ARENA_RADIUS - 2));
  arena.add(light);
}

// ----------------------
// Entities
// ----------------------
/** @typedef {{ id: number, type: keyof typeof ENEMY_TYPES, hp: number, maxHp: number, root: THREE.Group, mesh: THREE.Mesh, hpGroup: THREE.Group, hpFill: THREE.Mesh, radius: number, cooldownUntilMs: number, lastHurtMs: number }} Enemy */
/** @typedef {{ mesh: THREE.Mesh, vel: THREE.Vector3, damage: number, _dead?: boolean }} Projectile */
/** @typedef {{ id: number, mesh: THREE.Mesh, amount: number, _dead?: boolean }} AmmoPickup */

/** @type {Enemy[]} */
let enemies = [];
/** @type {Projectile[]} */
let projectiles = [];
/** @type {AmmoPickup[]} */
let ammoPickups = [];

let nextEnemyId = 1;
let nextPickupId = 1;

// ----------------------
// Player state
// ----------------------
let running = false;
let startTimeMs = 0;
let lastFrameMs = performance.now();
let lastSpawnMs = 0;

let playerHp = PLAYER_MAX_HP;
let kills = 0;

let ammo = 0;

let level = 1;
let waveTotal = 0;
let waveSpawned = 0;
let bossAlive = false;
let bossSpawned = false;

function calcWaveTotal(lv) {
  return 10 + (lv - 1) * 4;
}

function getBossStats(lv) {
  return {
    hp: 220 + (lv - 1) * 90,
    radius: 1.7 + (lv - 1) * 0.06,
  };
}

let weaponKey = 'pistol';
let weapon = WEAPONS[weaponKey];
let fireDown = false;
let nextShotMs = 0;

const keys = new Set();
let damageFlash = 0;

// ----------------------
// Helpers
// ----------------------
function resize() {
  const rect = playfield.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(playfield);
resize();

function updateHud() {
  playerHp = clamp(playerHp, 0, PLAYER_MAX_HP);
  const pct = (playerHp / PLAYER_MAX_HP) * 100;
  playerHpFill.style.width = `${pct}%`;
  playerHpText.textContent = String(Math.round(playerHp));
  weaponNameEl.textContent = weapon.name;
  levelEl.textContent = String(level);
  ammoEl.textContent = String(Math.max(0, Math.floor(ammo)));
  killsEl.textContent = String(kills);

  const bar = playerHpFill.parentElement;
  if (bar) bar.setAttribute('aria-valuenow', String(Math.round(playerHp)));
}

function showDamageFlash(intensity) {
  damageFlash = clamp(damageFlash + intensity, 0, 1);
  damageEl.style.opacity = String(damageFlash);
}

function lockPointer() {
  renderer.domElement.requestPointerLock?.();
}

function unlockPointer() {
  document.exitPointerLock?.();
}

function isPointerLocked() {
  return document.pointerLockElement === renderer.domElement;
}

function setGameOver(reason) {
  running = false;
  unlockPointer();

  const aliveS = (performance.now() - startTimeMs) / 1000;
  resultsDl.removeAttribute('hidden');
  resultKillsEl.textContent = String(kills);
  resultTimeEl.textContent = `${aliveS.toFixed(1)}s`;

  overlayText.textContent = `${reason} Click Start to try again.`;
  startBtn.textContent = 'Restart';
  setOverlayVisible(true);
}

function resetWorld() {
  for (const e of enemies) scene.remove(e.root);
  enemies = [];
  for (const p of projectiles) scene.remove(p.mesh);
  projectiles = [];
  for (const a of ammoPickups) scene.remove(a.mesh);
  ammoPickups = [];
}

function playArenaPulse({ color = 0xffffff, intensity = 1.6 } = {}) {
  const flash = new THREE.PointLight(color, intensity, 22);
  flash.position.set(0, 2.4, 0);
  scene.add(flash);
  window.setTimeout(() => scene.remove(flash), 140);

  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 1.0, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.06;
  scene.add(ringMesh);

  const start = performance.now();
  const dur = 280;
  const tick = () => {
    const t = (performance.now() - start) / dur;
    if (t >= 1) {
      scene.remove(ringMesh);
      return;
    }
    const s = 1 + t * 18;
    ringMesh.scale.setScalar(s);
    ringMesh.material.opacity = (1 - t) * 0.9;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function spawnAmmoPickup(force = false) {
  if (!running && !force) return;
  if (!force && ammoPickups.length >= 6) return;

  const big = Math.random() < 0.28;
  const amount = big ? 45 : 20;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.18, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4de1ff, emissiveIntensity: big ? 1.6 : 1.1, roughness: 0.35, metalness: 0.2 })
  );
  const angle = Math.random() * Math.PI * 2;
  const dist = randBetween(2.0, ARENA_RADIUS - 2.2);
  mesh.position.set(Math.cos(angle) * dist, 0.18, Math.sin(angle) * dist);
  mesh.rotation.y = Math.random() * Math.PI * 2;

  scene.add(mesh);
  ammoPickups.push({ id: nextPickupId++, mesh, amount });
}

function updateAmmoPickups(dt) {
  const playerPos = new THREE.Vector3(yaw.position.x, 0.18, yaw.position.z);

  for (const a of ammoPickups) {
    a.mesh.rotation.y += dt * 1.4;
    const d = a.mesh.position.distanceTo(playerPos);
    if (d < PLAYER_RADIUS + 0.55) {
      ammo += a.amount;
      updateHud();
      playTone({ freq: 740, type: 'sine', dur: 0.06, gainDb: -18, sweepTo: 980 });
      scene.remove(a.mesh);
      a._dead = true;
    }
  }

  ammoPickups = ammoPickups.filter((a) => !a._dead);
}

function createEnemyHpBar(enemyRadius) {
  const group = new THREE.Group();
  group.position.y = enemyRadius + 0.65;

  const w = Math.max(0.6, enemyRadius * 1.5);
  const h = 0.12;

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      color: 0x0b0c10,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    })
  );
  group.add(bg);

  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.02, h - 0.02),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
    })
  );
  fill.position.z = 0.001;
  fill.userData.hpWidth = w - 0.02;
  group.add(fill);

  return { group, fill, width: w };
}

function startGame() {
  resetWorld();

  const selected = weaponForm.querySelector('input[name="weapon"]:checked');
  weaponKey = selected ? selected.value : 'pistol';
  weapon = WEAPONS[weaponKey] ?? WEAPONS.pistol;

  ammo = weapon.startAmmo ?? 60;

  level = 1;
  waveTotal = calcWaveTotal(level);
  waveSpawned = 0;
  bossAlive = false;
  bossSpawned = false;

  playerHp = PLAYER_MAX_HP;
  kills = 0;
  updateHud();

  yaw.position.set(0, PLAYER_HEIGHT, 0);
  yaw.rotation.set(0, 0, 0);
  pitch.rotation.set(0, 0, 0);

  running = true;
  startTimeMs = performance.now();
  lastFrameMs = startTimeMs;
  lastSpawnMs = 0;
  nextShotMs = 0;
  damageFlash = 0;
  damageEl.style.opacity = '0';

  resultsDl.setAttribute('hidden', '');
  startBtn.textContent = 'Start';
  setOverlayVisible(false);

  lockPointer();

  for (let i = 0; i < 4; i += 1) spawnEnemy(true);
  for (let i = 0; i < 4; i += 1) spawnAmmoPickup(true);
}

function beginNextLevel() {
  level += 1;
  waveTotal = calcWaveTotal(level);
  waveSpawned = 0;
  bossAlive = false;
  bossSpawned = false;

  // A small ammo bump so the level transition doesn't feel empty.
  ammo += 6;
  spawnAmmoPickup(true);
  updateHud();
}

function trySpawnBossIfReady() {
  if (bossSpawned || bossAlive) return;
  if (waveSpawned < waveTotal) return;
  if (enemies.length > 0) return;

  bossSpawned = true;
  bossAlive = true;
  playBossSpawnSound();
  playArenaPulse({ color: 0xff4d7c, intensity: 2.2 });

  // Spawn boss near the edge
  const info = ENEMY_TYPES.boss;
  const bossStats = getBossStats(level);

  const mesh = createEnemyMesh('boss');
  const root = new THREE.Group();
  root.add(mesh);

  // Scale mesh up to match radius scaling
  const baseR = info.radius;
  const scale = bossStats.radius / baseR;
  mesh.scale.setScalar(scale);

  const hpBar = createEnemyHpBar(bossStats.radius);
  hpBar.group.renderOrder = 2;
  root.add(hpBar.group);

  const enemyId = nextEnemyId++;
  root.userData.enemyId = enemyId;
  mesh.userData.enemyId = enemyId;
  hpBar.group.userData.enemyId = enemyId;
  hpBar.fill.userData.enemyId = enemyId;

  const angle = Math.random() * Math.PI * 2;
  const dist = randBetween(ARENA_RADIUS - 2.8, ARENA_RADIUS - 1.8);
  root.position.set(Math.cos(angle) * dist, bossStats.radius, Math.sin(angle) * dist);

  scene.add(root);

  enemies.push({
    id: enemyId,
    type: 'boss',
    hp: bossStats.hp,
    maxHp: bossStats.hp,
    root,
    mesh,
    hpGroup: hpBar.group,
    hpFill: hpBar.fill,
    radius: bossStats.radius,
    cooldownUntilMs: performance.now() + randBetween(350, 900),
    lastHurtMs: 0,
  });
}

function createEnemyMesh(typeKey) {
  const info = ENEMY_TYPES[typeKey];
  let geom;
  if (info.geom === 'icosa') geom = new THREE.IcosahedronGeometry(info.radius, 0);
  else if (info.geom === 'octa') geom = new THREE.OctahedronGeometry(info.radius, 0);
  else geom = new THREE.BoxGeometry(info.radius * 1.2, info.radius * 1.2, info.radius * 1.2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: info.color,
    emissiveIntensity: 1.25,
    roughness: 0.25,
    metalness: 0.3,
  });

  const mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

function spawnEnemy(force = false) {
  const now = performance.now();
  if (!force) {
    if (bossAlive || bossSpawned) return;
    if (waveSpawned >= waveTotal) return;
    if (now - lastSpawnMs < SPAWN_INTERVAL_MS || enemies.length >= MAX_ENEMIES) return;
  }
  lastSpawnMs = now;

  const typeKey = pickEnemyType();
  const info = ENEMY_TYPES[typeKey];
  const mesh = createEnemyMesh(typeKey);

  const root = new THREE.Group();
  root.add(mesh);

  const hpBar = createEnemyHpBar(info.radius);
  hpBar.group.renderOrder = 2;
  root.add(hpBar.group);

  const enemyId = nextEnemyId++;
  root.userData.enemyId = enemyId;
  mesh.userData.enemyId = enemyId;
  hpBar.group.userData.enemyId = enemyId;
  hpBar.fill.userData.enemyId = enemyId;

  const angle = Math.random() * Math.PI * 2;
  const dist = randBetween(ARENA_RADIUS - 3, ARENA_RADIUS - 1.2);
  root.position.set(Math.cos(angle) * dist, info.radius, Math.sin(angle) * dist);

  scene.add(root);

  enemies.push({
    id: enemyId,
    type: typeKey,
    hp: info.hp,
    maxHp: info.hp,
    root,
    mesh,
    hpGroup: hpBar.group,
    hpFill: hpBar.fill,
    radius: info.radius,
    cooldownUntilMs: now + randBetween(200, 900),
    lastHurtMs: 0,
  });

  if (!force) waveSpawned += 1;
}

function damageEnemy(enemy, dmg, hitPoint) {
  const before = enemy.hp;
  enemy.hp -= dmg;

  const fillPct = clamp(enemy.hp / enemy.maxHp, 0, 1);
  enemy.hpFill.scale.x = fillPct;
  // Keep the left edge anchored while scaling
  const fillWidth = enemy.hpFill.userData.hpWidth ?? 1;
  enemy.hpFill.position.x = -((fillWidth * (1 - fillPct)) / 2);

  const mat = /** @type {THREE.MeshStandardMaterial} */ (enemy.mesh.material);
  mat.emissiveIntensity = 1.8;
  window.setTimeout(() => {
    mat.emissiveIntensity = 1.25;
  }, 60);

  const spark = new THREE.PointLight(0xffffff, 1.2, 3);
  spark.position.copy(hitPoint);
  scene.add(spark);
  window.setTimeout(() => scene.remove(spark), 80);

  if (before > 0 && enemy.hp > 0) {
    const now = performance.now();
    if (now - enemy.lastHurtMs > 120) {
      enemy.lastHurtMs = now;
      playEnemyHurtSound(enemy.type);
    }
  }

  if (enemy.hp <= 0) {
    kills += 1;
    screamOhNo();
    playNoiseClick({ gainDb: -18 });
    playTone({ freq: 980, type: 'sine', dur: 0.07, gainDb: -14, sweepTo: 740 });

    const burst = new THREE.PointLight(0xffffff, 2.4, 8);
    burst.position.copy(enemy.root.position);
    scene.add(burst);
    window.setTimeout(() => scene.remove(burst), 140);

    scene.remove(enemy.root);
    enemies = enemies.filter((e) => e.id !== enemy.id);

    if (enemy.type === 'boss') {
      bossAlive = false;
      playLevelClearSound();
      playArenaPulse({ color: 0xbffcff, intensity: 2.0 });
      beginNextLevel();
    }

    playerHp = clamp(playerHp + 3, 0, PLAYER_MAX_HP);
    updateHud();
  }
}

function shoot() {
  const now = performance.now();
  if (!running) return;
  // Pointer lock can be blocked in embedded browsers; still allow shooting.
  if (now < nextShotMs) return;

  if (ammo <= 0) {
    nextShotMs = now + Math.max(90, weapon.cooldownMs);
    playDryFire();
    return;
  }

  nextShotMs = now + weapon.cooldownMs;

  ammo -= 1;

  const camPos = camera.getWorldPosition(new THREE.Vector3());
  const camQuat = camera.getWorldQuaternion(new THREE.Quaternion());

  const flash = new THREE.PointLight(0xffffff, 1.5, 6);
  flash.position.copy(camPos);
  scene.add(flash);
  window.setTimeout(() => scene.remove(flash), 50);

  playNoiseClick({ gainDb: -22 });
  playTone({
    freq: weaponKey === 'shotgun' ? 320 : weaponKey === 'rifle' ? 520 : 620,
    type: 'square',
    dur: 0.05,
    gainDb: -16,
    sweepTo: weaponKey === 'shotgun' ? 240 : null,
  });

  const raycaster = new THREE.Raycaster();

  const muzzleOffset = new THREE.Vector3(0.1, -0.06, -0.25).applyQuaternion(camQuat);
  const muzzlePos = camPos.clone().add(muzzleOffset);

  for (let p = 0; p < weapon.pellets; p += 1) {
    const dx = (Math.random() * 2 - 1) * weapon.spread;
    const dy = (Math.random() * 2 - 1) * weapon.spread;

    raycaster.setFromCamera(new THREE.Vector2(dx, dy), camera);
    raycaster.far = weapon.range;

    let hitEnemy = null;
    let hitPoint = null;

    const roots = enemies.map((e) => e.root);
    const hits = raycaster.intersectObjects(roots, true);

    if (hits.length > 0) {
      const hit = hits[0];
      const enemyId = hit.object?.userData?.enemyId;
      const enemy = enemies.find((e) => e.id === enemyId);
      if (enemy) {
        hitEnemy = enemy;
        hitPoint = hit.point;
      }
    }

    // Fallback: ray-sphere test (for "can't kill shapes" cases)
    if (!hitEnemy) {
      const ro = raycaster.ray.origin;
      const rd = raycaster.ray.direction;
      let bestT = Infinity;
      for (const e of enemies) {
        const center = e.root.position;
        const oc = center.clone().sub(ro);
        const t = oc.dot(rd);
        if (t <= 0 || t > weapon.range) continue;
        const closest = ro.clone().addScaledVector(rd, t);
        const d = closest.distanceTo(center);
        const r = e.radius * 1.15;
        if (d <= r && t < bestT) {
          bestT = t;
          hitEnemy = e;
          hitPoint = closest;
        }
      }
    }

    const end = hitPoint ?? camPos.clone().addScaledVector(raycaster.ray.direction, weapon.range);
    const tracer = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([muzzlePos, end]),
      new THREE.LineBasicMaterial({ color: PLAYER_TRACER_COLOR, transparent: true, opacity: 0.95 })
    );
    tracer.frustumCulled = false;
    scene.add(tracer);
    window.setTimeout(() => scene.remove(tracer), TRACER_LIFETIME_MS);

    if (hitEnemy && hitPoint) damageEnemy(hitEnemy, weapon.damage, hitPoint);
  }

  updateHud();
}

function enemyShoot(enemy) {
  const info = ENEMY_TYPES[enemy.type];
  const now = performance.now();
  if (now < enemy.cooldownUntilMs) return;

  const toPlayer = new THREE.Vector3(yaw.position.x, PLAYER_HEIGHT, yaw.position.z).sub(enemy.root.position);
  const dist = toPlayer.length();
  if (dist > 26) return;

  enemy.cooldownUntilMs = now + info.fire.cooldownMs;

  const bursts = info.fire.burst ?? 1;
  for (let i = 0; i < bursts; i += 1) {
    const delay = i * 85;
    window.setTimeout(() => {
      if (!running) return;

      const dir = new THREE.Vector3(yaw.position.x, PLAYER_HEIGHT, yaw.position.z)
        .sub(enemy.root.position)
        .normalize();

      dir.x += randBetween(-0.04, 0.04);
      dir.z += randBetween(-0.04, 0.04);
      dir.normalize();

      const projMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshStandardMaterial({
          color: ENEMY_TRACER_COLOR,
          emissive: info.color,
          emissiveIntensity: 1.6,
          roughness: 0.3,
          metalness: 0.2,
        })
      );

      projMesh.position.copy(enemy.root.position);
      projMesh.position.y = Math.max(0.35, enemy.radius);

      scene.add(projMesh);

      projectiles.push({
        mesh: projMesh,
        vel: dir.multiplyScalar(info.fire.projectileSpeed),
        damage: info.fire.damage,
      });

      const flash = new THREE.PointLight(info.color, 0.9, 6);
      flash.position.copy(enemy.root.position);
      flash.position.y += enemy.radius * 0.5;
      scene.add(flash);
      window.setTimeout(() => scene.remove(flash), 60);

      playTone({ freq: enemy.type === 'sniper' ? 260 : 220, type: 'sine', dur: 0.05, gainDb: -22 });
    }, delay);
  }
}

function applyPlayerDamage(dmg) {
  playerHp -= dmg;
  showDamageFlash(0.35);
  playTone({ freq: 160, type: 'square', dur: 0.12, gainDb: -12, sweepTo: 110 });
  updateHud();

  if (playerHp <= 0) setGameOver('You got rekt.');
}

function updateProjectiles(dt) {
  const playerPos = new THREE.Vector3(yaw.position.x, PLAYER_HEIGHT, yaw.position.z);

  for (const p of projectiles) {
    p.mesh.position.addScaledVector(p.vel, dt);

    const r = Math.hypot(p.mesh.position.x, p.mesh.position.z);
    if (r > ARENA_RADIUS + 2 || p.mesh.position.y < -2 || p.mesh.position.y > 6) {
      scene.remove(p.mesh);
      p._dead = true;
      continue;
    }

    const d = p.mesh.position.distanceTo(playerPos);
    if (d < PLAYER_RADIUS + 0.18) {
      scene.remove(p.mesh);
      p._dead = true;
      applyPlayerDamage(p.damage);

      const hit = new THREE.PointLight(0xffffff, 1.6, 6);
      hit.position.copy(playerPos);
      scene.add(hit);
      window.setTimeout(() => scene.remove(hit), 90);
    }
  }

  projectiles = projectiles.filter((p) => !p._dead);
}

function updateEnemies(dt) {
  const playerXZ = new THREE.Vector3(yaw.position.x, 0, yaw.position.z);
  const camWorld = camera.getWorldPosition(new THREE.Vector3());

  for (const e of enemies) {
    const info = ENEMY_TYPES[e.type];

    const pos = e.root.position;
    const toPlayer = playerXZ.clone().sub(new THREE.Vector3(pos.x, 0, pos.z));
    const dist = toPlayer.length();

    if (dist > 0.001) {
      toPlayer.normalize();

      const desired = dist > 5.5 ? 1 : dist < 3.2 ? -0.65 : 0.2;
      const tangent = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);

      const move = toPlayer.multiplyScalar(desired).add(tangent.multiplyScalar(0.55));
      move.normalize();

      pos.x += move.x * info.speed * dt;
      pos.z += move.z * info.speed * dt;
    }

    const r = Math.hypot(pos.x, pos.z);
    if (r > ARENA_RADIUS - 1) {
      const s = (ARENA_RADIUS - 1) / r;
      pos.x *= s;
      pos.z *= s;
    }

    e.root.lookAt(yaw.position.x, e.radius, yaw.position.z);
    e.hpGroup.lookAt(camWorld);

    enemyShoot(e);
  }
}

function updatePlayer(dt) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(yaw.quaternion);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(yaw.quaternion);
  right.y = 0;
  right.normalize();

  const dir = new THREE.Vector3();
  if (keys.has('KeyW')) dir.add(forward);
  if (keys.has('KeyS')) dir.sub(forward);
  if (keys.has('KeyD')) dir.add(right);
  if (keys.has('KeyA')) dir.sub(right);

  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = PLAYER_SPEED * (sprinting ? PLAYER_SPRINT : 1);

  if (dir.lengthSq() > 0) {
    dir.normalize();
    yaw.position.x += dir.x * speed * dt;
    yaw.position.z += dir.z * speed * dt;
  }

  const r = Math.hypot(yaw.position.x, yaw.position.z);
  if (r > ARENA_RADIUS - 1.2) {
    const s = (ARENA_RADIUS - 1.2) / r;
    yaw.position.x *= s;
    yaw.position.z *= s;
  }

  damageFlash *= 0.86;
  damageEl.style.opacity = String(damageFlash);

  if (weapon.fireMode === 'auto' && fireDown) shoot();
}

function tick(nowMs) {
  if (!running) return;

  const dt = Math.min(0.033, (nowMs - lastFrameMs) / 1000);
  lastFrameMs = nowMs;

  spawnEnemy(false);
  trySpawnBossIfReady();
  if (ammoPickups.length < 4 && Math.random() < 0.012) spawnAmmoPickup(false);

  const bob = (keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD') ? 1 : 0) * Math.sin(nowMs * 0.018) * 0.007;
  const sway = Math.sin(nowMs * 0.012) * 0.004;
  viewModel.position.y = -0.22 + bob;
  viewModel.position.x = 0.26 + sway;
  viewModel.rotation.x = 0;

  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateAmmoPickups(dt);

  renderer.render(scene, camera);

  requestAnimationFrame(tick);
}

// ----------------------
// Input
// ----------------------
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Escape' && running) {
    unlockPointer();
    overlayText.textContent = 'Paused. Click Start to continue.';
    startBtn.textContent = 'Continue';
    resultsDl.setAttribute('hidden', '');
    setOverlayVisible(true);
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

window.addEventListener('mousemove', (e) => {
  if (!running) return;

  yaw.rotation.y -= e.movementX * MOUSE_SENS;
  pitch.rotation.x -= e.movementY * MOUSE_SENS;
  pitch.rotation.x = clamp(pitch.rotation.x, -1.45, 1.45);
});

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  fireDown = true;
  if (weapon.fireMode === 'semi') shoot();
});

window.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;
  fireDown = false;
});

startBtn.addEventListener('click', () => {
  // Ensure first user gesture unlocks audio.
  ensureAudio();

  if (!running) {
    startGame();
    requestAnimationFrame(tick);
    return;
  }

  setOverlayVisible(false);
  lockPointer();
});

document.addEventListener('pointerlockchange', () => {
  if (!running) return;
  if (!isPointerLocked()) {
    overlayText.textContent = 'Paused. Click Start to continue.';
    startBtn.textContent = 'Continue';
    resultsDl.setAttribute('hidden', '');
    setOverlayVisible(true);
  } else {
    setOverlayVisible(false);
  }
});

// ----------------------
// Init
// ----------------------
setOverlayVisible(true);
resultsDl.setAttribute('hidden', '');
updateHud();

camera.position.set(0, 0, 0);
weaponNameEl.textContent = WEAPONS.pistol.name;

weaponForm.addEventListener('change', () => {
  const selected = weaponForm.querySelector('input[name="weapon"]:checked');
  const key = selected ? selected.value : 'pistol';
  weaponNameEl.textContent = (WEAPONS[key] ?? WEAPONS.pistol).name;
});
