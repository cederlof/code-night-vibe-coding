// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const images = {
    walk: new Image(),
    dead: new Image(),
    background: new Image(),
    loaded: false
};

images.walk.src = 'assets/Walk (11).png';
images.dead.src = 'assets/Dead (15).png';
images.background.src = 'assets/backgroundimg.jpg';

// Wait for images to load
let imagesLoadedCount = 0;
images.walk.onload = () => {
    imagesLoadedCount++;
    if (imagesLoadedCount === 3) images.loaded = true;
};
images.dead.onload = () => {
    imagesLoadedCount++;
    if (imagesLoadedCount === 3) images.loaded = true;
};
images.background.onload = () => {
    imagesLoadedCount++;
    if (imagesLoadedCount === 3) images.loaded = true;
};

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playShootSound() {
    if (gameState.isMuted) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 150;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playHitSound() {
    if (gameState.isMuted) return;
    // "Ouch" sound - quick rise then fall in pitch
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    
    // Create "ow-ch" sound with pitch bend
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.05);
    oscillator.frequency.linearRampToValueAtTime(300, now + 0.15);
    
    // Volume envelope for "ouch"
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    oscillator.start(now);
    oscillator.stop(now + 0.25);
}

function playMissSound() {
    if (gameState.isMuted) return;
    // "Ho Ho Ho" Santa sound - three jolly "ho" sounds
    const now = audioContext.currentTime;
    
    // Create three "ho" sounds
    for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        
        const startTime = now + (i * 0.2);
        const duration = 0.15;
        
        // Deep "ho" frequency (like Santa's voice)
        oscillator.frequency.setValueAtTime(180, startTime);
        oscillator.frequency.linearRampToValueAtTime(150, startTime + duration);
        
        // Volume envelope for each "ho"
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
}

// Christmas background music
let musicOscillators = [];
let musicGainNode = null;
let isMusicPlaying = false;
let musicIntervalId = null;

function stopAllMusic() {
    isMusicPlaying = false;
    if (musicIntervalId) {
        clearInterval(musicIntervalId);
        musicIntervalId = null;
    }
    if (musicGainNode) {
        try {
            musicGainNode.gain.cancelScheduledValues(audioContext.currentTime);
            musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, audioContext.currentTime);
            musicGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        } catch (e) {
            // Ignore errors
        }
        setTimeout(() => {
            if (musicGainNode) {
                try {
                    musicGainNode.disconnect();
                } catch (e) {
                    // Already disconnected
                }
                musicGainNode = null;
            }
        }, 250);
    }
}

function playChristmasMusic() {
    if (gameState.isMuted) return;
    
    // Stop existing music first
    if (musicIntervalId) {
        clearInterval(musicIntervalId);
        musicIntervalId = null;
    }
    if (musicGainNode && isMusicPlaying) {
        try {
            musicGainNode.disconnect();
        } catch (e) {}
    }
    
    isMusicPlaying = true;
    gameState.currentMusicType = 'normal';
    
    // Create gain node for music volume control
    musicGainNode = audioContext.createGain();
    musicGainNode.gain.value = 0.15; // Quiet background music
    musicGainNode.connect(audioContext.destination);
    
    // Simple "Jingle Bells" melody notes (in Hz)
    const melody = [
        // Jingle bells, jingle bells, jingle all the way
        659, 659, 659, 0, // E E E
        659, 659, 659, 0, // E E E
        659, 784, 523, 587, 659, 0, // E G C D E
        // Oh what fun it is to ride
        698, 698, 698, 698, 698, 659, 659, 659, // F F F F F E E E
        659, 587, 587, 659, 587, 0, 784 // E D D E D G
    ];
    
    const noteDuration = 0.3; // seconds per note
    
    function playMelody(startTime) {
        melody.forEach((freq, index) => {
            if (freq === 0) return; // Rest
            
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();
            
            osc.connect(noteGain);
            noteGain.connect(musicGainNode);
            
            osc.type = 'triangle'; // Soft, bell-like tone
            osc.frequency.value = freq;
            
            const noteStart = startTime + (index * noteDuration);
            const noteEnd = noteStart + noteDuration * 0.8;
            
            // Envelope for each note
            noteGain.gain.setValueAtTime(0, noteStart);
            noteGain.gain.linearRampToValueAtTime(1, noteStart + 0.01);
            noteGain.gain.linearRampToValueAtTime(0.7, noteStart + 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.01, noteEnd);
            
            osc.start(noteStart);
            osc.stop(noteEnd);
            
            musicOscillators.push(osc);
        });
    }
    
    // Play melody and loop it
    const melodyLength = melody.length * noteDuration;
    let currentTime = audioContext.currentTime;
    
    // Initial play
    playMelody(currentTime);
    
    // Loop the melody
    musicIntervalId = setInterval(() => {
        if (isMusicPlaying && gameState.currentMusicType === 'normal') {
            playMelody(audioContext.currentTime);
        }
    }, melodyLength * 1000);
}

function playBossMusic() {
    if (gameState.isMuted) return;
    
    // Stop existing music first
    if (musicIntervalId) {
        clearInterval(musicIntervalId);
        musicIntervalId = null;
    }
    if (musicGainNode && isMusicPlaying) {
        try {
            musicGainNode.disconnect();
        } catch (e) {}
    }
    
    isMusicPlaying = true;
    gameState.currentMusicType = 'boss';
    
    // Create gain node for music volume control
    musicGainNode = audioContext.createGain();
    musicGainNode.gain.value = 0.25;
    musicGainNode.connect(audioContext.destination);
    
    function createScream(startTime, duration) {
        // Create scream-like sound using white noise and frequency sweep
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        
        // Filter for scream-like quality
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, startTime);
        filter.frequency.exponentialRampToValueAtTime(800, startTime + duration);
        filter.Q.value = 10;
        
        const screamGain = audioContext.createGain();
        screamGain.gain.setValueAtTime(0, startTime);
        screamGain.gain.linearRampToValueAtTime(0.8, startTime + 0.05);
        screamGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        noise.connect(filter);
        filter.connect(screamGain);
        screamGain.connect(musicGainNode);
        
        noise.start(startTime);
        noise.stop(startTime + duration);
    }
    
    function createDroneLayer(startTime, duration, freq) {
        // Low ominous drone
        const osc = audioContext.createOscillator();
        const droneGain = audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        droneGain.gain.setValueAtTime(0.3, startTime);
        droneGain.gain.setValueAtTime(0.3, startTime + duration - 0.1);
        droneGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(droneGain);
        droneGain.connect(musicGainNode);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
    
    function createDissonantStrike(startTime) {
        // Sharp dissonant hit
        const freqs = [66, 70, 139, 277]; // Dissonant cluster
        
        freqs.forEach(freq => {
            const osc = audioContext.createOscillator();
            const strikeGain = audioContext.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            strikeGain.gain.setValueAtTime(0.4, startTime);
            strikeGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(strikeGain);
            strikeGain.connect(musicGainNode);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }
    
    function playHorrorSequence(startTime) {
        // Low drone throughout
        createDroneLayer(startTime, 8, 55);
        createDroneLayer(startTime, 8, 73.42);
        
        // Screams at intervals
        createScream(startTime + 1, 0.8);
        createScream(startTime + 3.5, 1.2);
        createScream(startTime + 6, 0.7);
        
        // Dissonant strikes
        createDissonantStrike(startTime + 0.5);
        createDissonantStrike(startTime + 2.5);
        createDissonantStrike(startTime + 4.5);
        createDissonantStrike(startTime + 7);
    }
    
    // Play initial sequence
    playHorrorSequence(audioContext.currentTime);
    
    // Loop every 8 seconds
    musicIntervalId = setInterval(() => {
        if (isMusicPlaying && gameState.currentMusicType === 'boss') {
            playHorrorSequence(audioContext.currentTime);
        }
    }, 8000);
}

function stopChristmasMusic() {
    stopAllMusic();
}

// Resize canvas when window is resized
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Game state
const gameState = {
    currentState: 'menu', // 'menu', 'playing', 'gameover'
    level: 1,
    ammo: 5,
    isPlaying: false,
    isTransitioning: false,
    flashRed: false,
    flashDuration: 0,
    targets: [], // Changed from single target to array
    crosshairSize: 40,
    mouseX: 0,
    mouseY: 0,
    muzzleFlash: { active: false, x: 0, y: 0, frames: 0 },
    stats: { totalShots: 0, hits: 0, misses: 0 },
    deathAnimation: { active: false, x: 0, y: 0, width: 0, height: 0, frames: 0, rotation: 0, scale: 1 },
    snowParticles: [],
    bloodParticles: [],
    isMuted: false,
    currentMusicType: 'normal' // 'normal' or 'boss'
};

// Calculate number of targets based on level
function getTargetCount(level) {
    if (level >= 8) return 3;
    if (level >= 5) return 2;
    return 1;
}

// Snow particle class
class SnowParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 3 + 2;
        this.speed = Math.random() * 1 + 0.5;
        this.drift = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.6 + 0.4;
    }
    
    update() {
        this.y += this.speed;
        this.x += this.drift;
        
        if (this.y > canvas.height) {
            this.reset();
        }
        
        if (this.x < 0 || this.x > canvas.width) {
            this.x = Math.random() * canvas.width;
        }
    }
    
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Blood particle class
class BloodParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.size = Math.random() * 4 + 2;
        this.life = 30;
        this.maxLife = 30;
        this.color = Math.random() > 0.5 ? '#ff0000' : '#cc0000';
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Target object
class Target {
    constructor(level, isBoss = false) {
        this.isBoss = isBoss;
        this.health = isBoss ? 3 : 1;
        this.maxHealth = this.health;
        this.radius = this.calculateRadius(level);
        this.baseSize = this.radius * 2; // Use radius to determine image size
        this.width = this.baseSize * (isBoss ? 1.5 : 1);
        this.height = this.baseSize * (isBoss ? 1.5 : 1);
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = this.calculateSpeed(level) * (isBoss ? 1.2 : 1);
        this.direction = 1;
        this.color = '#ff4444';
        this.isDying = false;
        
        // Choose movement pattern based on level
        this.movementType = level >= 3 ? 'bird' : 'horizontal';
        this.startY = canvas.height / 2;
        
        // Bird movement properties
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.directionChangeTimer = 0;
        this.directionChangeInterval = 60 + Math.random() * 40; // Change direction every 60-100 frames
        this.flutter = 0;
    }

    calculateRadius(level) {
        // Start at 50px, decrease by 2px per level, minimum 15px
        return Math.max(50 - (level - 1) * 2, 15);
    }

    calculateSpeed(level) {
        // Tuned difficulty curve: easier start, progressive increase
        // Level 1: 1.5, Level 2: 2.5, Level 3: 3.5, Level 4: 5, Level 5: 7
        return 1.5 + (level - 1) * 0.5 + Math.pow(level - 1, 1.3) * 0.15;
    }

    update() {
        if (this.movementType === 'horizontal') {
            this.x += this.speed * this.direction;
            
            // Bounce off edges
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.direction *= -1;
            }
        } else if (this.movementType === 'bird') {
            // Bird-like erratic movement
            this.directionChangeTimer++;
            
            // Randomly change direction
            if (this.directionChangeTimer >= this.directionChangeInterval) {
                this.vx = (Math.random() * 2 - 1) * this.speed;
                this.vy = (Math.random() * 2 - 1) * this.speed;
                this.directionChangeTimer = 0;
                this.directionChangeInterval = 40 + Math.random() * 60;
            }
            
            // Add flutter/wave motion
            this.flutter += 0.1;
            const flutterOffset = Math.sin(this.flutter) * 0.5;
            
            // Update position
            this.x += this.vx + flutterOffset;
            this.y += this.vy;
            
            // Bounce off edges with direction change
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.vx *= -1;
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            }
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
                this.vy *= -1;
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
            }
        }
    }

    draw() {
        if (!images.loaded) {
            // Fallback to circle if images not loaded
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        
        // Draw the walk sprite image
        ctx.save();
        
        // Add subtle glow
        ctx.shadowColor = 'rgba(255, 100, 100, 0.3)';
        ctx.shadowBlur = 10;
        
        // Draw image centered on x, y position
        ctx.drawImage(
            images.walk,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        
        ctx.restore();
        
        // Draw health bar for boss
        if (this.isBoss && this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 8;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 15;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ff0000';
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    isHit(x, y) {
        // Check if click is within image bounds (with slight padding for better feel)
        const padding = 5;
        return x >= this.x - this.width / 2 - padding &&
               x <= this.x + this.width / 2 + padding &&
               y >= this.y - this.height / 2 - padding &&
               y <= this.y + this.height / 2 + padding;
    }
    
    takeDamage() {
        this.health--;
        return this.health <= 0;
    }
}

// Create crosshair cursor using canvas
function createCrosshairCursor() {
    // Create a small canvas for the cursor
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = 50;
    cursorCanvas.height = 50;
    const cursorCtx = cursorCanvas.getContext('2d');
    
    const center = 25;
    const size = 18;
    const gap = 6;
    
    // Draw outer glow/shadow
    cursorCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    cursorCtx.lineWidth = 4;
    cursorCtx.beginPath();
    cursorCtx.arc(center, center, 20, 0, Math.PI * 2);
    cursorCtx.stroke();
    
    // Draw crosshair lines with gradient effect
    cursorCtx.strokeStyle = '#00ff00';
    cursorCtx.lineWidth = 2.5;
    cursorCtx.shadowColor = '#00ff00';
    cursorCtx.shadowBlur = 3;
    
    // Top line
    cursorCtx.beginPath();
    cursorCtx.moveTo(center, center - size);
    cursorCtx.lineTo(center, center - gap);
    cursorCtx.stroke();
    
    // Bottom line
    cursorCtx.beginPath();
    cursorCtx.moveTo(center, center + gap);
    cursorCtx.lineTo(center, center + size);
    cursorCtx.stroke();
    
    // Left line
    cursorCtx.beginPath();
    cursorCtx.moveTo(center - size, center);
    cursorCtx.lineTo(center - gap, center);
    cursorCtx.stroke();
    
    // Right line
    cursorCtx.beginPath();
    cursorCtx.moveTo(center + gap, center);
    cursorCtx.lineTo(center + size, center);
    cursorCtx.stroke();
    
    // Outer circle
    cursorCtx.strokeStyle = '#00ff00';
    cursorCtx.lineWidth = 1.5;
    cursorCtx.beginPath();
    cursorCtx.arc(center, center, 20, 0, Math.PI * 2);
    cursorCtx.stroke();
    
    // Center dot with glow
    cursorCtx.fillStyle = '#00ff00';
    cursorCtx.shadowBlur = 5;
    cursorCtx.beginPath();
    cursorCtx.arc(center, center, 2.5, 0, Math.PI * 2);
    cursorCtx.fill();
    
    // Convert canvas to cursor
    const dataURL = cursorCanvas.toDataURL();
    canvas.style.cursor = `url(${dataURL}) 25 25, crosshair`;
}

// Initialize snow particles
function initSnow() {
    gameState.snowParticles = [];
    for (let i = 0; i < 100; i++) {
        gameState.snowParticles.push(new SnowParticle());
    }
}

// Create blood splatter
function createBloodSplatter(x, y) {
    for (let i = 0; i < 15; i++) {
        gameState.bloodParticles.push(new BloodParticle(x, y));
    }
}

// Initialize game
function initGame() {
    gameState.currentState = 'playing';
    gameState.level = 1;
    gameState.ammo = 5;
    gameState.isPlaying = true;
    gameState.isTransitioning = false;
    gameState.flashRed = false;
    gameState.stats = { totalShots: 0, hits: 0, misses: 0 };
    
    createTargets();
    updateHUD();
    hideGameOver();
    hideStartScreen();
    showHUD();
    createCrosshairCursor();
    
    // Start Christmas music
    playChristmasMusic();
}

// UI control functions
function showStartScreen() {
    document.getElementById('startScreen').style.display = 'flex';
}

function hideStartScreen() {
    document.getElementById('startScreen').style.display = 'none';
}

function showHUD() {
    document.getElementById('hud').style.display = 'block';
}

function hideHUD() {
    document.getElementById('hud').style.display = 'none';
}

// Update HUD
function updateHUD() {
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('ammoDisplay').textContent = gameState.ammo;
}

// Show level transition
function showLevelTransition() {
    const levelTransition = document.getElementById('levelTransition');
    levelTransition.textContent = `Level ${gameState.level}`;
    levelTransition.style.display = 'block';
    
    setTimeout(() => {
        levelTransition.style.display = 'none';
        gameState.isTransitioning = false;
        // Create new targets after transition completes
        createTargets();
    }, 1000);
}

// Create targets based on level
function createTargets() {
    gameState.targets = [];
    const isBossLevel = gameState.level % 5 === 0;
    
    if (isBossLevel) {
        // Switch to boss music
        playBossMusic();
        
        const boss = new Target(gameState.level, true);
        boss.x = canvas.width / 2;
        boss.y = canvas.height / 2;
        gameState.targets.push(boss);
    } else {
        // Switch to normal music if coming from boss level
        if (gameState.currentMusicType === 'boss') {
            playChristmasMusic();
        }
        
        const targetCount = getTargetCount(gameState.level);
        
        for (let i = 0; i < targetCount; i++) {
            const target = new Target(gameState.level, false);
            target.x = (canvas.width / (targetCount + 1)) * (i + 1);
            target.y = canvas.height / 2 + (Math.random() * 200 - 100);
            gameState.targets.push(target);
        }
    }
}

// Show game over
function showGameOver() {
    gameState.currentState = 'gameover';
    gameState.isPlaying = false;
    hideHUD();
    document.getElementById('finalLevel').textContent = gameState.level - 1;
    document.getElementById('totalShots').textContent = gameState.stats.totalShots;
    document.getElementById('totalHits').textContent = gameState.stats.hits;
    document.getElementById('totalMisses').textContent = gameState.stats.misses;
    const accuracy = gameState.stats.totalShots > 0 
        ? Math.round((gameState.stats.hits / gameState.stats.totalShots) * 100) 
        : 0;
    document.getElementById('accuracy').textContent = accuracy;
    document.getElementById('gameOver').style.display = 'flex';
}

// Hide game over
function hideGameOver() {
    document.getElementById('gameOver').style.display = 'none';
}

// Handle shooting
function shoot(x, y) {
    if (!gameState.isPlaying || gameState.isTransitioning) return;
    
    // Play shoot sound
    playShootSound();
    
    // Trigger muzzle flash
    gameState.muzzleFlash = { active: true, x: x, y: y, frames: 8 };
    
    // Every shot costs 1 ammo
    gameState.ammo--;
    gameState.stats.totalShots++;
    updateHUD();
    
    // Check if any target was hit
    let hitTarget = null;
    let hitIndex = -1;
    for (let i = 0; i < gameState.targets.length; i++) {
        if (gameState.targets[i].isHit(x, y)) {
            hitTarget = gameState.targets[i];
            hitIndex = i;
            break;
        }
    }
    
    if (hitTarget) {
        // Hit!
        playHitSound();
        gameState.stats.hits++;
        createBloodSplatter(hitTarget.x, hitTarget.y);
        
        const isDead = hitTarget.takeDamage();
        if (isDead) {
            gameState.targets.splice(hitIndex, 1);
        }
        
        handleHit(hitTarget, isDead);
    } else {
        // Miss!
        playMissSound();
        gameState.stats.misses++;
        handleMiss();
    }
}

// Handle hit
function handleHit(target, isDead) {
    if (isDead) {
        // Show epic death animation for killed target
        gameState.deathAnimation = {
            active: true,
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height,
            frames: 40,
            rotation: 0,
            scale: 1
        };
        
        // Check if all targets are eliminated
        if (gameState.targets.length === 0) {
            // Progress to next level
            gameState.level++;
            gameState.ammo += 5;
            gameState.isTransitioning = true;
            updateHUD();
            
            // Delay level transition to let death animation play
            setTimeout(() => {
                showLevelTransition();
            }, 600);
        }
    }
}

// Handle miss
function handleMiss() {
    // Flash red with improved intensity
    gameState.flashRed = true;
    gameState.flashDuration = 15; // frames (longer for better visibility)
    
    // Check if out of ammo
    if (gameState.ammo <= 0) {
        showGameOver();
    }
}

// Draw epic death animation
function drawDeathAnimation(anim) {
    if (!images.loaded) return;
    
    const maxFrames = 40;
    const progress = 1 - (anim.frames / maxFrames);
    
    ctx.save();
    
    ctx.translate(anim.x, anim.y);
    
    anim.rotation += 0.15;
    anim.scale = 1 + progress * 0.5;
    ctx.rotate(anim.rotation);
    ctx.scale(anim.scale, anim.scale);
    
    ctx.globalAlpha = 1 - progress;
    
    ctx.drawImage(
        images.dead,
        -anim.width / 2,
        -anim.height / 2,
        anim.width,
        anim.height
    );
    
    ctx.restore();
}

// Enhanced muzzle flash effect
function drawMuzzleFlash(x, y, frame) {
    const maxFrames = 8;
    const progress = 1 - (frame / maxFrames);
    
    // Outer flash (yellow-orange)
    const outerSize = 30 * progress;
    const outerAlpha = 0.7 * progress;
    ctx.fillStyle = `rgba(255, 200, 0, ${outerAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, outerSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle flash (bright yellow)
    const middleSize = 20 * progress;
    const middleAlpha = 0.8 * progress;
    ctx.fillStyle = `rgba(255, 255, 100, ${middleAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, middleSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner flash (white hot center)
    const innerSize = 10 * progress;
    const innerAlpha = 0.9 * progress;
    ctx.fillStyle = `rgba(255, 255, 255, ${innerAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, innerSize, 0, Math.PI * 2);
    ctx.fill();
}

// Game loop
function gameLoop() {
    // Draw background image fitted to screen
    if (images.loaded && images.background.complete) {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback color while loading
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Apply red flash overlay if active
    if (gameState.flashRed) {
        const flashIntensity = gameState.flashDuration / 15;
        ctx.fillStyle = `rgba(139, 0, 0, ${0.5 * flashIntensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update flash
    if (gameState.flashRed) {
        gameState.flashDuration--;
        if (gameState.flashDuration <= 0) {
            gameState.flashRed = false;
        }
    }
    
    // Update and draw snow particles
    for (const particle of gameState.snowParticles) {
        particle.update();
        particle.draw();
    }
    
    // Update and draw targets
    if (gameState.isPlaying && !gameState.isTransitioning) {
        for (const target of gameState.targets) {
            target.update();
            target.draw();
        }
    }
    
    // Update and draw blood particles
    for (let i = gameState.bloodParticles.length - 1; i >= 0; i--) {
        const particle = gameState.bloodParticles[i];
        particle.update();
        particle.draw();
        if (particle.isDead()) {
            gameState.bloodParticles.splice(i, 1);
        }
    }
    
    // Draw death animation
    if (gameState.deathAnimation.active) {
        drawDeathAnimation(gameState.deathAnimation);
        gameState.deathAnimation.frames--;
        if (gameState.deathAnimation.frames <= 0) {
            gameState.deathAnimation.active = false;
        }
    }
    
    // Draw muzzle flash
    if (gameState.muzzleFlash.active) {
        drawMuzzleFlash(gameState.muzzleFlash.x, gameState.muzzleFlash.y, gameState.muzzleFlash.frames);
        gameState.muzzleFlash.frames--;
        if (gameState.muzzleFlash.frames <= 0) {
            gameState.muzzleFlash.active = false;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Mouse tracking
canvas.addEventListener('mousemove', (e) => {
    gameState.mouseX = e.clientX;
    gameState.mouseY = e.clientY;
});

// Click handler - use mousedown for immediate response
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left click
    const x = e.clientX;
    const y = e.clientY;
    shoot(x, y);
});

// Try again button
document.getElementById('tryAgainBtn').addEventListener('click', () => {
    initGame();
});

// Play button on start screen
document.getElementById('playBtn').addEventListener('click', () => {
    initGame();
});

// Mute button
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
    gameState.isMuted = !gameState.isMuted;
    
    if (gameState.isMuted) {
        muteBtn.textContent = '🔇';
        muteBtn.classList.add('muted');
        stopAllMusic();
    } else {
        muteBtn.textContent = '🔊';
        muteBtn.classList.remove('muted');
        // Restart appropriate music if playing
        if (gameState.isPlaying) {
            const isBossLevel = gameState.level % 5 === 0;
            if (isBossLevel) {
                playBossMusic();
            } else {
                playChristmasMusic();
            }
        }
    }
});

// Start game - show start screen initially
showStartScreen();
initSnow();
gameLoop();
