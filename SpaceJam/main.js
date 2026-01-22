// Game constants
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 800;
const SAFE_ZONE_HEIGHT = 80;
const LANE_HEIGHT = 80;

// 3D Mode state
const mode3D = {
    enabled: false,
    scene: null,
    camera: null,
    renderer: null,
    objects: {
        player: null,
        ships: [],
        asteroids: [],
        blackHoles: [],
        explosions: [],
        lanes: []
    },
    mouse: {
        x: 0,
        y: 0,
        sensitivity: 0.002,
        yaw: 0, // Start facing forward (negative Z direction)
        pitch: -0.1, // Slight downward angle to see the path ahead
        locked: false
    }
};

// Level configurations
const LEVEL_CONFIG = [
    { level: 1, lanes: 3, time: 40, speedMultiplier: 1.0, spawnInterval: 800, blackHoles: 0 },
    { level: 2, lanes: 4, time: 35, speedMultiplier: 1.15, spawnInterval: 700, blackHoles: 1 },
    { level: 3, lanes: 5, time: 30, speedMultiplier: 1.3, spawnInterval: 600, blackHoles: 1 },
    { level: 4, lanes: 6, time: 25, speedMultiplier: 1.45, spawnInterval: 550, blackHoles: 2 },
    { level: 5, lanes: 7, time: 20, speedMultiplier: 1.6, spawnInterval: 500, blackHoles: 3 }
];

// Game state
const game = {
    canvas: null,
    ctx: null,
    level: 1,
    lives: 3,
    score: 0,
    timer: 60,
    maxTime: 60,
    gameRunning: true,
    deathFlash: false,
    flashTimer: 0,
    keys: {},
    lastTime: 0,
    levelCompleted: false,
    showingLevelTransition: false,
    screenShake: 0,
    particles: [],
    asteroids: [],
    explosions: []
};

// Player class
class Player {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.reset();
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 0.25;
        this.maxSpeed = 2.5;
        this.friction = 0.85;
    }

    reset() {
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT - SAFE_ZONE_HEIGHT + 20;
    }

    update(deltaTime) {
        // Handle input
        let inputX = 0;
        let inputY = 0;
        
        if (game.keys['ArrowLeft']) inputX -= 1;
        if (game.keys['ArrowRight']) inputX += 1;
        if (game.keys['ArrowUp']) inputY -= 1;
        if (game.keys['ArrowDown']) inputY += 1;

        // Apply acceleration
        if (inputX !== 0) {
            this.velocityX += inputX * this.acceleration;
        }
        if (inputY !== 0) {
            this.velocityY += inputY * this.acceleration;
        }

        // Apply friction
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // Clamp velocity
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.maxSpeed) {
            this.velocityX = (this.velocityX / speed) * this.maxSpeed;
            this.velocityY = (this.velocityY / speed) * this.maxSpeed;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep in bounds
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
            this.velocityX = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            this.velocityY = 0;
        }
    }

    draw(ctx) {
        // Draw space woman with better sprite
        // Body
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Helmet glow
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + 6,
            2,
            this.x + this.width / 2, this.y + 6,
            8
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(200, 150, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.2)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Visor
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x + 5, this.y + 4, 10, 4);
        
        // Jetpack
        ctx.fillStyle = '#cc00cc';
        ctx.fillRect(this.x + 3, this.y + 12, 6, 6);
        ctx.fillRect(this.x + 11, this.y + 12, 6, 6);
        
        // Jetpack flames (if moving)
        if (Math.abs(this.velocityX) > 0.3 || Math.abs(this.velocityY) > 0.3) {
            const flicker = 0.7 + Math.random() * 0.3;
            ctx.fillStyle = `rgba(255, 150, 0, ${flicker})`;
            ctx.fillRect(this.x + 4, this.y + 18, 4, 3);
            ctx.fillRect(this.x + 12, this.y + 18, 4, 3);
            ctx.fillStyle = `rgba(255, 255, 0, ${flicker * 0.7})`;
            ctx.fillRect(this.x + 5, this.y + 19, 2, 2);
            ctx.fillRect(this.x + 13, this.y + 19, 2, 2);
        }
        
        // Outer glow
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Ship class
class Ship {
    constructor(lane, direction, type) {
        this.lane = lane;
        this.direction = direction; // 1 = right, -1 = left
        this.type = type; // 0 = small, 1 = medium, 2 = large
        
        const lengths = [40, 70, 100];
        this.width = lengths[type];
        this.height = 30;
        
        const baseSpeed = [3.5, 4.5, 5.5];
        const config = LEVEL_CONFIG[game.level - 1];
        this.speed = baseSpeed[type] * config.speedMultiplier;
        
        this.y = SAFE_ZONE_HEIGHT + lane * LANE_HEIGHT + (LANE_HEIGHT - this.height) / 2;
        
        if (direction === 1) {
            this.x = -this.width;
        } else {
            this.x = CANVAS_WIDTH;
        }
        
        const colors = ['#4444ff', '#6666ff', '#8888ff'];
        this.color = colors[type];
    }

    update(deltaTime) {
        this.x += this.speed * this.direction;
    }

    draw(ctx) {
        // Engine flame/trail first (drawn behind ship)
        // Add flicker variation based on time and random
        const flicker = 0.7 + Math.sin(Date.now() / 100) * 0.15 + Math.random() * 0.15;
        const flameLength = 15 * flicker;
        const flameIntensity = 0.6 + Math.random() * 0.3;
        
        if (this.direction === 1) {
            // Moving right - flame on left side
            const gradient = ctx.createLinearGradient(this.x - flameLength, this.y, this.x, this.y);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
            gradient.addColorStop(0.5, `rgba(255, 150, 0, ${flameIntensity * 0.6})`);
            gradient.addColorStop(1, `rgba(255, 200, 0, ${flameIntensity})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - flameLength, this.y + 8, flameLength, 14);
            
            // Flame flicker effect - varies in size and brightness
            const coreSize = 6 + Math.random() * 4;
            ctx.fillStyle = `rgba(255, 255, ${100 + Math.random() * 155}, ${0.6 + Math.random() * 0.4})`;
            ctx.fillRect(this.x - 10, this.y + 13 - coreSize/2, coreSize, coreSize);
        } else {
            // Moving left - flame on right side
            const gradient = ctx.createLinearGradient(this.x + this.width, this.y, this.x + this.width + flameLength, this.y);
            gradient.addColorStop(0, `rgba(255, 200, 0, ${flameIntensity})`);
            gradient.addColorStop(0.5, `rgba(255, 150, 0, ${flameIntensity * 0.6})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x + this.width, this.y + 8, flameLength, 14);
            
            // Flame flicker effect - varies in size and brightness
            const coreSize = 6 + Math.random() * 4;
            ctx.fillStyle = `rgba(255, 255, ${100 + Math.random() * 155}, ${0.6 + Math.random() * 0.4})`;
            ctx.fillRect(this.x + this.width + 2, this.y + 13 - coreSize/2, coreSize, coreSize);
        }
        
        // Ship body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add windows/details
        ctx.fillStyle = '#aaaaff';
        const windowCount = Math.floor(this.width / 15);
        for (let i = 0; i < windowCount; i++) {
            ctx.fillRect(this.x + 5 + i * 15, this.y + 10, 8, 8);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOffScreen() {
        if (this.direction === 1) {
            return this.x > CANVAS_WIDTH + 50;
        } else {
            return this.x < -this.width - 50;
        }
    }
}

// Ship manager
const shipManager = {
    ships: [],
    spawnTimer: 0,
    spawnInterval: 800,
    laneDirections: [],
    
    reset() {
        this.ships = [];
        this.spawnTimer = 0;
        const config = LEVEL_CONFIG[game.level - 1];
        this.spawnInterval = config.spawnInterval;
        // Randomize lane directions for variety
        this.laneDirections = [];
        for (let i = 0; i < config.lanes; i++) {
            this.laneDirections[i] = Math.random() < 0.5 ? 1 : -1;
        }
    },
    
    update(deltaTime) {
        // Update existing ships
        for (let i = this.ships.length - 1; i >= 0; i--) {
            this.ships[i].update(deltaTime);
            if (this.ships[i].isOffScreen()) {
                this.ships.splice(i, 1);
            }
        }
        
        // Spawn new ships
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnShip();
        }
    },
    
    spawnShip() {
        const config = LEVEL_CONFIG[game.level - 1];
        const lane = Math.floor(Math.random() * config.lanes);
        const direction = this.laneDirections[lane];
        const type = Math.floor(Math.random() * 3);
        
        this.ships.push(new Ship(lane, direction, type));
    },
    
    draw(ctx) {
        this.ships.forEach(ship => ship.draw(ctx));
    }
};

// Black hole class
class BlackHole {
    constructor() {
        this.radius = 40;
        this.randomizePosition();
    }
    
    randomizePosition() {
        const config = LEVEL_CONFIG[game.level - 1];
        const gameAreaHeight = config.lanes * LANE_HEIGHT;
        
        // Place in game area, not in safe zones
        this.x = Math.random() * (CANVAS_WIDTH - this.radius * 2) + this.radius;
        this.y = SAFE_ZONE_HEIGHT + Math.random() * gameAreaHeight;
    }
    
    update(deltaTime) {
        // Static position, no update needed
    }
    
    draw(ctx) {
        // Draw distortion effect with pulsing animation
        const pulseSize = Math.sin(Date.now() / 300) * 5;
        const effectRadius = this.radius + pulseSize;
        
        // Outer distortion glow
        const outerGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, effectRadius * 1.5
        );
        outerGradient.addColorStop(0, 'rgba(100, 0, 100, 0.4)');
        outerGradient.addColorStop(0.6, 'rgba(80, 0, 80, 0.2)');
        outerGradient.addColorStop(1, 'rgba(50, 0, 50, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, effectRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main black hole
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, effectRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(50, 0, 50, 0.9)');
        gradient.addColorStop(1, 'rgba(100, 0, 100, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, effectRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw swirl effect
        ctx.strokeStyle = 'rgba(150, 0, 150, 0.7)';
        ctx.lineWidth = 2;
        const swirlCount = 3;
        for (let i = 0; i < swirlCount; i++) {
            const offset = (Date.now() / 400 + i * Math.PI * 2 / swirlCount) % (Math.PI * 2);
            ctx.beginPath();
            ctx.arc(this.x, this.y, effectRadius * 0.7, offset, offset + Math.PI * 0.8);
            ctx.stroke();
        }
        
        // Inner core
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    applyPullForce(player) {
        const dx = this.x - (player.x + player.width / 2);
        const dy = this.y - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Contact = death
        if (distance < this.radius) {
            return true;
        }
        
        // Apply pull force based on proximity and level
        const pullRadius = this.radius * 3.5;
        if (distance < pullRadius) {
            const normalizedDist = 1 - (distance / pullRadius);
            const levelMultiplier = 0.5 + (game.level - 1) * 0.15; // Much stronger pull
            const pullStrength = normalizedDist * normalizedDist * levelMultiplier;
            
            const angle = Math.atan2(dy, dx);
            player.velocityX += Math.cos(angle) * pullStrength;
            player.velocityY += Math.sin(angle) * pullStrength;
        }
        
        return false;
    }
}

// Black hole manager
const blackHoleManager = {
    blackHoles: [],
    
    reset() {
        this.blackHoles = [];
        const config = LEVEL_CONFIG[game.level - 1];
        
        for (let i = 0; i < config.blackHoles; i++) {
            this.blackHoles.push(new BlackHole());
        }
    },
    
    update(deltaTime) {
        this.blackHoles.forEach(bh => bh.update(deltaTime));
    },
    
    draw(ctx) {
        this.blackHoles.forEach(bh => bh.draw(ctx));
    },
    
    checkPlayerCollision(player) {
        for (let bh of this.blackHoles) {
            if (bh.applyPullForce(player)) {
                return true; // Death by contact
            }
        }
        return false;
    }
};

// Asteroid manager
const asteroidManager = {
    asteroids: [],
    spawnTimer: 0,
    spawnInterval: 3000,
    
    reset() {
        this.asteroids = [];
        this.spawnTimer = 0;
    },
    
    update(deltaTime) {
        // Update existing asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            this.asteroids[i].update(deltaTime);
            if (this.asteroids[i].isOffScreen()) {
                this.asteroids.splice(i, 1);
            }
        }
        
        // Spawn new asteroids
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.asteroids.push(new Asteroid());
        }
    },
    
    draw(ctx) {
        this.asteroids.forEach(asteroid => asteroid.draw(ctx));
    },
    
    checkShipCollisions(ships) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            const aBounds = asteroid.getBounds();
            
            for (let j = ships.length - 1; j >= 0; j--) {
                const ship = ships[j];
                const sBounds = ship.getBounds();
                
                // Circle-rectangle collision
                const closestX = Math.max(sBounds.x, Math.min(aBounds.centerX, sBounds.x + sBounds.width));
                const closestY = Math.max(sBounds.y, Math.min(aBounds.centerY, sBounds.y + sBounds.height));
                const dx = aBounds.centerX - closestX;
                const dy = aBounds.centerY - closestY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < aBounds.radius) {
                    // Collision! Create explosion
                    const explosionRadius = Math.max(sBounds.width, sBounds.height) * 2;
                    game.explosions.push(new Explosion(
                        sBounds.x + sBounds.width / 2,
                        sBounds.y + sBounds.height / 2,
                        explosionRadius
                    ));
                    
                    // Remove ship and asteroid
                    ships.splice(j, 1);
                    this.asteroids.splice(i, 1);
                    game.screenShake = 0.3;
                    break;
                }
            }
        }
    },
    
    checkPlayerCollision(player) {
        for (let asteroid of this.asteroids) {
            const aBounds = asteroid.getBounds();
            const pBounds = player.getBounds();
            
            // Circle-rectangle collision
            const closestX = Math.max(pBounds.x, Math.min(aBounds.centerX, pBounds.x + pBounds.width));
            const closestY = Math.max(pBounds.y, Math.min(aBounds.centerY, pBounds.y + pBounds.height));
            const dx = aBounds.centerX - closestX;
            const dy = aBounds.centerY - closestY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < aBounds.radius) {
                return true; // Hit by asteroid
            }
        }
        return false;
    }
};

// Collision detection
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Particle class for death effects
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 2 + Math.random() * 3;
        this.color = Math.random() > 0.5 ? '#ff00ff' : '#ffaa00';
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life -= this.decay;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Asteroid class
class Asteroid {
    constructor() {
        this.size = 15 + Math.random() * 25;
        this.x = Math.random() * (CANVAS_WIDTH - this.size);
        this.y = -this.size;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 2 + Math.random() * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        // Draw jagged asteroid
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = this.size / 2 * (0.7 + Math.random() * 0.3);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size,
            centerX: this.x + this.size / 2,
            centerY: this.y + this.size / 2,
            radius: this.size / 2
        };
    }
    
    isOffScreen() {
        return this.y > CANVAS_HEIGHT + this.size;
    }
}

// Explosion class
class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.life = 1.0;
        this.particles = [];
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    update(deltaTime) {
        this.life -= 0.03;
        this.radius = this.maxRadius * (1 + (1 - this.life) * 0.5);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
        });
    }
    
    draw(ctx) {
        // Draw explosion flash
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${this.life * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.life * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        ctx.fillStyle = `rgba(255, 150, 0, ${this.life})`;
        this.particles.forEach(p => {
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    affectsPlayer(player) {
        const dx = this.x - (player.x + player.width / 2);
        const dy = this.y - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius;
    }
}

// Player instance
const player = new Player();

// ===== 3D MODE IMPLEMENTATION =====

function init3DMode() {
    if (typeof THREE === 'undefined') {
        alert('Three.js library not loaded!');
        return false;
    }

    // Create scene
    mode3D.scene = new THREE.Scene();
    mode3D.scene.background = new THREE.Color(0x0a0a1a);
    mode3D.scene.fog = new THREE.Fog(0x0a0a1a, 50, 300);

    // Create camera (first person)
    mode3D.camera = new THREE.PerspectiveCamera(
        100, // FOV - wider field of view for better orientation
        CANVAS_WIDTH / CANVAS_HEIGHT, // aspect
        0.1, // near
        3000 // far - see much further ahead
    );
    
    // Create renderer
    mode3D.renderer = new THREE.WebGLRenderer({ antialias: true });
    mode3D.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Replace canvas
    const oldCanvas = document.getElementById('gameCanvas');
    const container = oldCanvas.parentElement;
    container.removeChild(oldCanvas);
    mode3D.renderer.domElement.id = 'gameCanvas';
    mode3D.renderer.domElement.style.border = '2px solid #333';
    container.insertBefore(mode3D.renderer.domElement, container.firstChild);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    mode3D.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 50, 50);
    mode3D.scene.add(directionalLight);

    // Create ground/lanes
    createLanes3D();
    
    // Create safe zones
    createSafeZones3D();

    // Setup pointer lock for mouse look
    setupPointerLock();

    return true;
}

function createLanes3D() {
    const config = LEVEL_CONFIG[game.level - 1];
    const totalHeight = config.lanes * LANE_HEIGHT;
    
    // Convert 2D coordinates to 3D
    // In 2D: Y goes down from 0 to CANVAS_HEIGHT
    // In 3D: Z goes forward (away from camera), Y is height
    
    for (let i = 0; i < config.lanes; i++) {
        const geometry = new THREE.PlaneGeometry(CANVAS_WIDTH, LANE_HEIGHT);
        const material = new THREE.MeshLambertMaterial({ 
            color: i % 2 === 0 ? 0x1a1a3a : 0x0f0f2a,
            side: THREE.DoubleSide 
        });
        const lane = new THREE.Mesh(geometry, material);
        
        // Position lanes
        lane.rotation.x = -Math.PI / 2;
        lane.position.y = 0;
        lane.position.z = -(SAFE_ZONE_HEIGHT + i * LANE_HEIGHT + LANE_HEIGHT / 2);
        
        mode3D.scene.add(lane);
        mode3D.objects.lanes.push(lane);
    }
}

function createSafeZones3D() {
    // Bottom safe zone (near camera)
    const bottomGeom = new THREE.PlaneGeometry(CANVAS_WIDTH, SAFE_ZONE_HEIGHT);
    const safeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x1a1a3a,
        side: THREE.DoubleSide 
    });
    const bottomZone = new THREE.Mesh(bottomGeom, safeMaterial);
    bottomZone.rotation.x = -Math.PI / 2;
    bottomZone.position.y = 0;
    bottomZone.position.z = -(CANVAS_HEIGHT - SAFE_ZONE_HEIGHT / 2);
    mode3D.scene.add(bottomZone);

    // Top safe zone (far from camera)
    const topZone = new THREE.Mesh(bottomGeom.clone(), safeMaterial.clone());
    topZone.rotation.x = -Math.PI / 2;
    topZone.position.y = 0;
    topZone.position.z = -(SAFE_ZONE_HEIGHT / 2);
    mode3D.scene.add(topZone);
}

function setupPointerLock() {
    const canvas = mode3D.renderer.domElement;
    
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        mode3D.mouse.locked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (e) => {
        if (!mode3D.mouse.locked) return;

        mode3D.mouse.yaw -= e.movementX * mode3D.mouse.sensitivity;
        mode3D.mouse.pitch -= e.movementY * mode3D.mouse.sensitivity;

        // Clamp pitch to avoid flipping
        mode3D.mouse.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mode3D.mouse.pitch));
    });
}

function convertTo3DPosition(x, y) {
    // Convert 2D canvas coordinates to 3D world coordinates
    return {
        x: x - CANVAS_WIDTH / 2,
        y: 10, // Height above ground
        z: -y
    };
}

function create3DPlayer() {
    // Create a simple astronaut representation
    const group = new THREE.Group();
    
    // Body (capsule-like)
    const bodyGeom = new THREE.CylinderGeometry(3, 3, 8, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff00ff });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 4;
    group.add(body);
    
    // Helmet
    const helmetGeom = new THREE.SphereGeometry(4, 16, 16);
    const helmetMat = new THREE.MeshLambertMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.8
    });
    const helmet = new THREE.Mesh(helmetGeom, helmetMat);
    helmet.position.y = 10;
    group.add(helmet);
    
    // Visor
    const visorGeom = new THREE.BoxGeometry(3, 1.5, 0.5);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 10, 3.5);
    group.add(visor);
    
    // Jetpack (two cylinders)
    const jetpackGeom = new THREE.CylinderGeometry(1, 1, 4, 8);
    const jetpackMat = new THREE.MeshLambertMaterial({ color: 0xcc00cc });
    
    const jetpack1 = new THREE.Mesh(jetpackGeom, jetpackMat);
    jetpack1.position.set(-2, 4, -3);
    group.add(jetpack1);
    
    const jetpack2 = new THREE.Mesh(jetpackGeom, jetpackMat);
    jetpack2.position.set(2, 4, -3);
    group.add(jetpack2);
    
    return group;
}

function create3DShip(ship) {
    const group = new THREE.Group();
    
    // Ship body - make it much taller and more visible
    const bodyGeom = new THREE.BoxGeometry(ship.width, 35, ship.height * 1.5);
    const colors = [0x4444ff, 0x6666ff, 0x8888ff];
    const bodyMat = new THREE.MeshLambertMaterial({ color: colors[ship.type] });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 17.5;
    group.add(body);
    
    // Windows
    const windowGeom = new THREE.BoxGeometry(4, 6, 6);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xaaaaff });
    const windowCount = Math.floor(ship.width / 15);
    
    for (let i = 0; i < windowCount; i++) {
        const window = new THREE.Mesh(windowGeom, windowMat);
        window.position.set(-ship.width/2 + 10 + i * 15, 17.5, 0);
        group.add(window);
    }
    
    // Engine glow - make it bigger
    const glowGeom = new THREE.SphereGeometry(6, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0xff8800,
        transparent: true,
        opacity: 0.7
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(ship.direction === 1 ? -ship.width/2 : ship.width/2, 17.5, 0);
    group.add(glow);
    
    return group;
}

function create3DAsteroid(asteroid) {
    const group = new THREE.Group();
    
    // Create irregular asteroid shape
    const geom = new THREE.DodecahedronGeometry(asteroid.size / 2, 0);
    const mat = new THREE.MeshLambertMaterial({ 
        color: 0x8B4513,
        flatShading: true 
    });
    const mesh = new THREE.Mesh(geom, mat);
    
    // Randomize vertices for irregular shape
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(
            i,
            positions.getX(i) * (0.8 + Math.random() * 0.4),
            positions.getY(i) * (0.8 + Math.random() * 0.4),
            positions.getZ(i) * (0.8 + Math.random() * 0.4)
        );
    }
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    
    group.add(mesh);
    return group;
}

function create3DBlackHole(blackHole) {
    const group = new THREE.Group();
    
    // Main black sphere
    const geom = new THREE.SphereGeometry(blackHole.radius, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geom, mat);
    group.add(sphere);
    
    // Distortion rings
    for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.TorusGeometry(blackHole.radius * (1.2 + i * 0.3), 2, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x800080,
            transparent: true,
            opacity: 0.3 - i * 0.1
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
    }
    
    return group;
}

function create3DExplosion(explosion) {
    const group = new THREE.Group();
    
    // Create particle system for explosion
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * explosion.radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xff8800,
        size: 5,
        transparent: true,
        opacity: explosion.life
    });
    
    const particles = new THREE.Points(geometry, material);
    group.add(particles);
    
    // Explosion sphere
    const sphereGeom = new THREE.SphereGeometry(explosion.radius, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ 
        color: 0xff8800,
        transparent: true,
        opacity: explosion.life * 0.3
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphere);
    
    return group;
}

function update3DScene() {
    if (!mode3D.enabled) return;

    // Update camera position based on player
    const playerPos = convertTo3DPosition(
        player.x + player.width / 2,
        player.y + player.height / 2
    );
    
    // Position camera much higher up (like elevated cockpit view) and face forward
    mode3D.camera.position.set(playerPos.x, playerPos.y + 40, playerPos.z);
    
    // Apply mouse look
    mode3D.camera.rotation.order = 'YXZ';
    mode3D.camera.rotation.y = mode3D.mouse.yaw;
    mode3D.camera.rotation.x = mode3D.mouse.pitch;

    // Clear and recreate ships
    mode3D.objects.ships.forEach(obj => mode3D.scene.remove(obj));
    mode3D.objects.ships = [];
    
    shipManager.ships.forEach(ship => {
        const ship3D = create3DShip(ship);
        const pos = convertTo3DPosition(ship.x + ship.width / 2, ship.y + ship.height / 2);
        ship3D.position.set(pos.x, pos.y, pos.z);
        ship3D.rotation.y = ship.direction === 1 ? -Math.PI / 2 : Math.PI / 2;
        mode3D.scene.add(ship3D);
        mode3D.objects.ships.push(ship3D);
    });

    // Update asteroids
    mode3D.objects.asteroids.forEach(obj => mode3D.scene.remove(obj));
    mode3D.objects.asteroids = [];
    
    asteroidManager.asteroids.forEach(asteroid => {
        const asteroid3D = create3DAsteroid(asteroid);
        const pos = convertTo3DPosition(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
        asteroid3D.position.set(pos.x, pos.y, pos.z);
        asteroid3D.rotation.set(asteroid.rotation, asteroid.rotation * 1.5, asteroid.rotation * 0.5);
        mode3D.scene.add(asteroid3D);
        mode3D.objects.asteroids.push(asteroid3D);
    });

    // Update black holes
    mode3D.objects.blackHoles.forEach(obj => mode3D.scene.remove(obj));
    mode3D.objects.blackHoles = [];
    
    blackHoleManager.blackHoles.forEach(bh => {
        const bh3D = create3DBlackHole(bh);
        const pos = convertTo3DPosition(bh.x, bh.y);
        bh3D.position.set(pos.x, pos.y, pos.z);
        
        // Animate rings
        bh3D.children.forEach((child, i) => {
            if (i > 0) {
                child.rotation.z += 0.01 * (i + 1);
            }
        });
        
        mode3D.scene.add(bh3D);
        mode3D.objects.blackHoles.push(bh3D);
    });

    // Update explosions
    mode3D.objects.explosions.forEach(obj => mode3D.scene.remove(obj));
    mode3D.objects.explosions = [];
    
    game.explosions.forEach(explosion => {
        const exp3D = create3DExplosion(explosion);
        const pos = convertTo3DPosition(explosion.x, explosion.y);
        exp3D.position.set(pos.x, pos.y, pos.z);
        mode3D.scene.add(exp3D);
        mode3D.objects.explosions.push(exp3D);
    });

    // Render scene
    mode3D.renderer.render(mode3D.scene, mode3D.camera);
}

function toggle3DMode() {
    if (!mode3D.enabled) {
        // Switch to 3D mode
        if (init3DMode()) {
            mode3D.enabled = true;
            document.getElementById('mode3DBtn').textContent = 'Switch to 2D Mode';
            game.canvas.style.display = 'none';
        }
    } else {
        // Switch back to 2D mode
        mode3D.enabled = false;
        
        // Remove 3D renderer
        if (mode3D.renderer) {
            const container = mode3D.renderer.domElement.parentElement;
            container.removeChild(mode3D.renderer.domElement);
            
            // Restore 2D canvas
            game.canvas.style.display = 'block';
            container.insertBefore(game.canvas, container.firstChild);
        }
        
        // Reset mouse
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        document.getElementById('mode3DBtn').textContent = 'Switch to 3D Mode';
    }
}

// Game functions
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // 3D mode button
    document.getElementById('mode3DBtn').addEventListener('click', toggle3DMode);
    
    // Event listeners
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        
        // Cheat codes: CTRL + 1-5
        if (e.ctrlKey && game.gameRunning) {
            const levelNum = parseInt(e.key);
            if (levelNum >= 1 && levelNum <= 5) {
                game.level = levelNum;
                resetLevel();
                showMessage('Cheat: Level ' + levelNum);
                e.preventDefault();
                return;
            }
        }
        
        game.keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });
    
    resetLevel();
    requestAnimationFrame(gameLoop);
}

function resetLevel() {
    player.reset();
    shipManager.reset();
    blackHoleManager.reset();
    asteroidManager.reset();
    game.explosions = [];
    
    const config = LEVEL_CONFIG[game.level - 1];
    game.timer = config.time;
    game.maxTime = config.time;
    game.levelCompleted = false;
    game.showingLevelTransition = false;
    
    updateUI();
}

function handleDeath() {
    game.lives--;
    updateUI();
    
    // Spawn particles
    for (let i = 0; i < 30; i++) {
        game.particles.push(new Particle(
            player.x + player.width / 2,
            player.y + player.height / 2
        ));
    }
    
    // Screen shake
    game.screenShake = 0.5;
    
    if (game.lives <= 0) {
        gameOver();
        return;
    }
    
    // Flash effect
    game.deathFlash = true;
    game.flashTimer = 0.5;
    
    // Respawn
    player.reset();
    player.velocityX = 0;
    player.velocityY = 0;
}

function checkLevelComplete() {
    if (player.y < SAFE_ZONE_HEIGHT && !game.levelCompleted) {
        game.levelCompleted = true;
        game.showingLevelTransition = true;
        
        // Add remaining time as score
        if (game.timer > 0) {
            game.score += Math.floor(game.timer);
        }
        
        updateUI();
        
        if (game.level >= 5) {
            // Won the game!
            showMessage('YOU WIN!');
            setTimeout(() => {
                const gameOverEl = document.getElementById('gameOver');
                gameOverEl.querySelector('h2').textContent = 'YOU WIN!';
                gameOverEl.querySelector('h2').style.color = '#00ff00';
                document.getElementById('finalScore').textContent = game.score;
                gameOverEl.style.display = 'block';
                game.gameRunning = false;
            }, 2000);
        } else {
            // Next level
            game.level++;
            showMessage('Level ' + game.level);
            setTimeout(() => {
                resetLevel();
            }, 2000);
        }
    }
}

function gameOver() {
    game.gameRunning = false;
    const gameOverEl = document.getElementById('gameOver');
    gameOverEl.querySelector('h2').textContent = 'GAME OVER';
    gameOverEl.querySelector('h2').style.color = '#ff0000';
    document.getElementById('finalScore').textContent = game.score;
    gameOverEl.style.display = 'block';
}

function showMessage(text) {
    const msgEl = document.getElementById('message');
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
        msgEl.style.display = 'none';
    }, 2000);
}

function updateUI() {
    document.getElementById('levelDisplay').textContent = game.level;
    document.getElementById('livesDisplay').textContent = game.lives;
    document.getElementById('scoreDisplay').textContent = game.score;
    document.getElementById('timeDisplay').textContent = Math.max(0, Math.floor(game.timer));
    
    const timerPercent = Math.max(0, (game.timer / game.maxTime) * 100);
    document.getElementById('timerFill').style.width = timerPercent + '%';
}

function update(deltaTime) {
    if (!game.gameRunning || game.showingLevelTransition) return;
    
    // Update death flash
    if (game.deathFlash) {
        game.flashTimer -= deltaTime / 1000;
        if (game.flashTimer <= 0) {
            game.deathFlash = false;
        }
    }
    
    // Update screen shake
    if (game.screenShake > 0) {
        game.screenShake -= deltaTime / 1000;
        if (game.screenShake < 0) game.screenShake = 0;
    }
    
    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        game.particles[i].update(deltaTime);
        if (game.particles[i].isDead()) {
            game.particles.splice(i, 1);
        }
    }
    
    // Update explosions
    for (let i = game.explosions.length - 1; i >= 0; i--) {
        game.explosions[i].update(deltaTime);
        if (game.explosions[i].isDead()) {
            game.explosions.splice(i, 1);
        }
    }
    
    // Update timer
    game.timer -= deltaTime / 1000;
    updateUI();
    
    // Update game objects
    player.update(deltaTime);
    shipManager.update(deltaTime);
    blackHoleManager.update(deltaTime);
    asteroidManager.update(deltaTime);
    
    // Check collisions with ships
    const playerBounds = player.getBounds();
    for (let ship of shipManager.ships) {
        if (checkCollision(playerBounds, ship.getBounds())) {
            handleDeath();
            return;
        }
    }
    
    // Check asteroid collisions with ships
    asteroidManager.checkShipCollisions(shipManager.ships);
    
    // Check collisions with asteroids
    if (asteroidManager.checkPlayerCollision(player)) {
        handleDeath();
        return;
    }
    
    // Check if player is in explosion radius
    for (let explosion of game.explosions) {
        if (explosion.affectsPlayer(player)) {
            handleDeath();
            return;
        }
    }
    
    // Check collisions with black holes
    if (blackHoleManager.checkPlayerCollision(player)) {
        handleDeath();
        return;
    }
    
    // Check level completion
    checkLevelComplete();
}

function draw() {
    // Handle 3D mode
    if (mode3D.enabled) {
        update3DScene();
        return;
    }
    
    const ctx = game.ctx;
    
    // Apply screen shake
    ctx.save();
    if (game.screenShake > 0) {
        const shakeAmount = game.screenShake * 10;
        ctx.translate(
            (Math.random() - 0.5) * shakeAmount,
            (Math.random() - 0.5) * shakeAmount
        );
    }
    
    // Clear canvas
    ctx.fillStyle = game.deathFlash ? '#ff0000' : '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (game.deathFlash) {
        ctx.globalAlpha = 0.5;
    }
    
    // Draw safe zones
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, SAFE_ZONE_HEIGHT);
    ctx.fillRect(0, CANVAS_HEIGHT - SAFE_ZONE_HEIGHT, CANVAS_WIDTH, SAFE_ZONE_HEIGHT);
    
    // Draw lane dividers
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const config = LEVEL_CONFIG[game.level - 1];
    for (let i = 0; i <= config.lanes; i++) {
        const y = SAFE_ZONE_HEIGHT + i * LANE_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
    
    // Draw game objects
    blackHoleManager.draw(ctx); // Draw black holes first (behind everything)
    asteroidManager.draw(ctx);
    shipManager.draw(ctx);
    game.explosions.forEach(e => e.draw(ctx));
    player.draw(ctx);
    
    // Draw particles
    game.particles.forEach(p => p.draw(ctx));
    
    if (game.deathFlash) {
        ctx.globalAlpha = 1;
    }
    
    ctx.restore(); // Restore transform (end screen shake)
    
    // Draw safe zone labels (not affected by shake)
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('SAFE ZONE', 10, 30);
    ctx.fillText('SAFE ZONE', 10, CANVAS_HEIGHT - 30);
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;
    
    if (deltaTime < 100) { // Prevent huge deltas
        update(deltaTime);
    }
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Start game
init();
