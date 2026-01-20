// Game constants
const CELL_SIZE = 80;
const MAZE_SIZE = 10;
const CANVAS_SIZE = CELL_SIZE * MAZE_SIZE;

// Physics constants (tuned for better feel)
const ACCELERATION = 0.35;
const MAX_SPEED = 6;
const FRICTION = 0.96;
const BRAKE_POWER = 0.88;
const TURN_SPEED = 0.055;
const DRIFT_FACTOR = 0.96;
const COLLISION_BOUNCE = 0.5;
const COLLISION_SPEED_PENALTY = 0.4;
const COLLISION_SLOWDOWN_DURATION = 400; // ms

// Maze presets (0 = path, 1 = wall)
const MAZES = {
    small: {
        name: "Small Maze",
        size: 10,
        cellSize: 80,
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        start: { x: 1.5, y: 1.5 },
        goal: { x: 8, y: 8, width: 1, height: 1 }
    },
    medium: {
        name: "Medium Maze",
        size: 15,
        cellSize: 53,
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        start: { x: 1.5, y: 1.5 },
        goal: { x: 13, y: 13, width: 1, height: 1 }
    },
    large: {
        name: "Large Maze",
        size: 20,
        cellSize: 40,
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        start: { x: 1.5, y: 1.5 },
        goal: { x: 18, y: 18, width: 1, height: 1 }
    },
    spiral: {
        name: "Spiral Challenge",
        size: 15,
        cellSize: 53,
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        start: { x: 1.5, y: 1.5 },
        goal: { x: 7, y: 7, width: 1, height: 1 }
    }
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.currentMazeId = 'small';
        this.currentMaze = MAZES[this.currentMazeId];
        this.car = null;
        this.timer = 0;
        this.timerStarted = false;
        this.gameWon = false;
        this.collisionSlowdownUntil = 0;
        this.bestTime = this.loadBestTime();
        this.collisionShake = { active: false, duration: 0, intensity: 0 };
        
        this.updateCanvasSize();
        this.setupInput();
        this.setupMazeSelector();
        this.restart();
        this.updateBestTimeDisplay();
        this.gameLoop();
    }

    updateCanvasSize() {
        const size = this.currentMaze.size * this.currentMaze.cellSize;
        this.canvas.width = size;
        this.canvas.height = size;
    }

    setupMazeSelector() {
        const selector = document.getElementById('mazeSelect');
        selector.value = this.currentMazeId;
        selector.addEventListener('change', (e) => {
            this.changeMaze(e.target.value);
        });

        const resetButton = document.getElementById('resetBestTime');
        resetButton.addEventListener('click', () => {
            this.resetBestTime();
        });
    }

    changeMaze(mazeId) {
        this.currentMazeId = mazeId;
        this.currentMaze = MAZES[mazeId];
        this.updateCanvasSize();
        this.bestTime = this.loadBestTime();
        this.updateBestTimeDisplay();
        this.restart();
    }

    resetBestTime() {
        if (confirm(`Reset best time for ${this.currentMaze.name}?`)) {
            localStorage.removeItem(`mazeRacerBestTime_${this.currentMazeId}`);
            this.bestTime = null;
            this.updateBestTimeDisplay();
        }
    }

    restart() {
        this.car = {
            x: this.currentMaze.start.x * this.currentMaze.cellSize,
            y: this.currentMaze.start.y * this.currentMaze.cellSize,
            angle: 0,
            speed: 0,
            vx: 0,
            vy: 0,
            size: 12,
            collisionSize: 8
        };
        this.timer = 0;
        this.timerStarted = false;
        this.gameWon = false;
        this.collisionSlowdownUntil = 0;
        this.collisionShake = { active: false, duration: 0, intensity: 0 };
        document.getElementById('winMessage').classList.remove('show');
    }

    loadBestTime() {
        const saved = localStorage.getItem(`mazeRacerBestTime_${this.currentMazeId}`);
        return saved ? parseFloat(saved) : null;
    }

    saveBestTime(time) {
        localStorage.setItem(`mazeRacerBestTime_${this.currentMazeId}`, time.toString());
        this.bestTime = time;
    }

    updateBestTimeDisplay() {
        const elem = document.getElementById('bestTime');
        if (this.bestTime !== null) {
            elem.textContent = (this.bestTime / 1000).toFixed(2) + 's';
        } else {
            elem.textContent = '--';
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Start timer on first movement input
            if (!this.timerStarted && !this.gameWon && 
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.timerStarted = true;
            }
            
            // Restart
            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    update(deltaTime) {
        if (this.gameWon) return;

        const now = Date.now();
        const isSlowedDown = now < this.collisionSlowdownUntil;

        // Handle input
        if (this.keys['ArrowUp']) {
            this.car.speed = Math.min(this.car.speed + ACCELERATION, MAX_SPEED);
        }
        if (this.keys['ArrowDown']) {
            this.car.speed *= BRAKE_POWER;
        }

        // Turning with drift
        if (this.keys['ArrowLeft']) {
            this.car.angle -= TURN_SPEED * (1 + this.car.speed / MAX_SPEED);
        }
        if (this.keys['ArrowRight']) {
            this.car.angle += TURN_SPEED * (1 + this.car.speed / MAX_SPEED);
        }

        // Apply friction
        if (!this.keys['ArrowUp']) {
            this.car.speed *= FRICTION;
        }

        // Apply collision slowdown
        if (isSlowedDown) {
            this.car.speed *= 0.98;
        }

        // Update velocity based on angle and speed
        const targetVx = Math.cos(this.car.angle) * this.car.speed;
        const targetVy = Math.sin(this.car.angle) * this.car.speed;

        // Drift: velocity doesn't instantly match direction
        this.car.vx += (targetVx - this.car.vx) * (1 - DRIFT_FACTOR);
        this.car.vy += (targetVy - this.car.vy) * (1 - DRIFT_FACTOR);

        // Save old position for collision
        const oldX = this.car.x;
        const oldY = this.car.y;

        // Update position
        this.car.x += this.car.vx;
        this.car.y += this.car.vy;

        // Check collision
        if (this.checkCollision()) {
            // Rebound
            this.car.x = oldX;
            this.car.y = oldY;
            this.car.vx *= -COLLISION_BOUNCE;
            this.car.vy *= -COLLISION_BOUNCE;
            this.car.speed *= COLLISION_SPEED_PENALTY;
            this.collisionSlowdownUntil = now + COLLISION_SLOWDOWN_DURATION;
            
            // Trigger shake effect
            this.collisionShake = { 
                active: true, 
                duration: 200, 
                intensity: 5,
                startTime: now
            };
        }

        // Check goal
        if (this.checkGoal()) {
            this.gameWon = true;
            this.showWinMessage();
        }

        // Update timer
        if (this.timerStarted && !this.gameWon) {
            this.timer += deltaTime;
        }
    }

    checkCollision() {
        // Use circular collision detection for rotation-independent hitbox
        const carGridX = Math.floor(this.car.x / this.currentMaze.cellSize);
        const carGridY = Math.floor(this.car.y / this.currentMaze.cellSize);
        const radius = this.car.collisionSize;

        // Check 3x3 area around car
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = carGridX + dx;
                const checkY = carGridY + dy;

                if (checkX < 0 || checkX >= this.currentMaze.size || 
                    checkY < 0 || checkY >= this.currentMaze.size) {
                    continue;
                }

                if (this.currentMaze.layout[checkY][checkX] === 1) {
                    // Wall found, check if circular car overlaps rectangular wall
                    const wallX = checkX * this.currentMaze.cellSize;
                    const wallY = checkY * this.currentMaze.cellSize;
                    const wallW = this.currentMaze.cellSize;
                    const wallH = this.currentMaze.cellSize;

                    // Find closest point on wall rectangle to car center
                    const closestX = Math.max(wallX, Math.min(this.car.x, wallX + wallW));
                    const closestY = Math.max(wallY, Math.min(this.car.y, wallY + wallH));

                    // Calculate distance from car center to closest point
                    const distX = this.car.x - closestX;
                    const distY = this.car.y - closestY;
                    const distSquared = distX * distX + distY * distY;

                    // Collision if distance is less than radius
                    if (distSquared < radius * radius) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    checkGoal() {
        const goalX = this.currentMaze.goal.x * this.currentMaze.cellSize;
        const goalY = this.currentMaze.goal.y * this.currentMaze.cellSize;
        const goalW = this.currentMaze.goal.width * this.currentMaze.cellSize;
        const goalH = this.currentMaze.goal.height * this.currentMaze.cellSize;

        return this.car.x > goalX && this.car.x < goalX + goalW &&
               this.car.y > goalY && this.car.y < goalY + goalH;
    }

    showWinMessage() {
        const finalTimeSeconds = this.timer / 1000;
        document.getElementById('finalTime').textContent = finalTimeSeconds.toFixed(2) + 's';
        
        // Check if new record
        const isNewRecord = this.bestTime === null || this.timer < this.bestTime;
        
        if (isNewRecord) {
            this.saveBestTime(this.timer);
            this.updateBestTimeDisplay();
            document.getElementById('newRecord').style.display = 'block';
            document.getElementById('bestTimeDisplay').textContent = 'New Best Time!';
        } else {
            document.getElementById('newRecord').style.display = 'none';
            const diff = ((this.timer - this.bestTime) / 1000).toFixed(2);
            document.getElementById('bestTimeDisplay').textContent = 
                `Best: ${(this.bestTime / 1000).toFixed(2)}s (+${diff}s)`;
        }
        
        document.getElementById('winMessage').classList.add('show');
    }

    render() {
        const canvasSize = this.currentMaze.size * this.currentMaze.cellSize;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Apply shake effect
        this.ctx.save();
        if (this.collisionShake.active) {
            const elapsed = Date.now() - this.collisionShake.startTime;
            if (elapsed < this.collisionShake.duration) {
                const progress = 1 - (elapsed / this.collisionShake.duration);
                const shakeX = (Math.random() - 0.5) * this.collisionShake.intensity * progress;
                const shakeY = (Math.random() - 0.5) * this.collisionShake.intensity * progress;
                this.ctx.translate(shakeX, shakeY);
            } else {
                this.collisionShake.active = false;
            }
        }

        // Draw maze
        this.ctx.fillStyle = '#444';
        for (let y = 0; y < this.currentMaze.size; y++) {
            for (let x = 0; x < this.currentMaze.size; x++) {
                if (this.currentMaze.layout[y][x] === 1) {
                    this.ctx.fillRect(x * this.currentMaze.cellSize, y * this.currentMaze.cellSize, 
                                     this.currentMaze.cellSize, this.currentMaze.cellSize);
                }
            }
        }

        // Draw grid lines (subtle)
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.currentMaze.size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.currentMaze.cellSize, 0);
            this.ctx.lineTo(i * this.currentMaze.cellSize, canvasSize);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.currentMaze.cellSize);
            this.ctx.lineTo(canvasSize, i * this.currentMaze.cellSize);
            this.ctx.stroke();
        }

        // Draw goal with enhanced animation
        const goalX = this.currentMaze.goal.x * this.currentMaze.cellSize;
        const goalY = this.currentMaze.goal.y * this.currentMaze.cellSize;
        const goalW = this.currentMaze.goal.width * this.currentMaze.cellSize;
        const goalH = this.currentMaze.goal.height * this.currentMaze.cellSize;
        
        // Base goal
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(goalX, goalY, goalW, goalH);
        
        // Pulsing overlay
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(0, 255, 0, ${pulse * 0.5})`;
        this.ctx.fillRect(goalX, goalY, goalW, goalH);
        
        // Rotating corners
        const cornerPulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(255, 255, 0, ${cornerPulse})`;
        const cornerSize = Math.min(goalW, goalH) * 0.2;
        this.ctx.fillRect(goalX, goalY, cornerSize, cornerSize);
        this.ctx.fillRect(goalX + goalW - cornerSize, goalY, cornerSize, cornerSize);
        this.ctx.fillRect(goalX, goalY + goalH - cornerSize, cornerSize, cornerSize);
        this.ctx.fillRect(goalX + goalW - cornerSize, goalY + goalH - cornerSize, cornerSize, cornerSize);

        // Draw car
        this.ctx.save();
        this.ctx.translate(this.car.x, this.car.y);
        this.ctx.rotate(this.car.angle);

        // Car body
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(-this.car.size, -this.car.size / 2, this.car.size * 2, this.car.size);

        // Car front (direction indicator)
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(this.car.size * 0.8, -this.car.size / 4, this.car.size * 0.4, this.car.size / 2);

        this.ctx.restore();

        // Update HUD
        document.getElementById('speedometer').textContent = 
            Math.round((this.car.speed / MAX_SPEED) * 100);
        document.getElementById('timer').textContent = 
            (this.timer / 1000).toFixed(2) + 's';
        
        // Restore shake transform
        this.ctx.restore();
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = now - (this.lastTime || now);
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
const game = new Game();
