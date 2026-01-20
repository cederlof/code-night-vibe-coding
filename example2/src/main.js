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

// 3D Rendering constants
const CAR_HEIGHT = 10;
const WALL_HEIGHT = CAR_HEIGHT * 3;
const CAMERA_DISTANCE = 150;
const CAMERA_HEIGHT = 80;
const CAMERA_OFFSET = 20; // Side offset
const CAMERA_SMOOTHING = 0.1;

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

// 3D Renderer using Three.js
class Renderer3D {
    constructor(container, maze) {
        this.container = container;
        this.maze = maze;
        
        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Setup camera
        const size = maze.size * maze.cellSize;
        this.camera = new THREE.PerspectiveCamera(
            60,
            size / size,
            1,
            2000
        );
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(size, size);
        this.container.appendChild(this.renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
        
        // Create maze geometry
        this.createMaze();
        
        // Create car
        this.createCar();
        
        // Create goal
        this.createGoal();
        
        // Camera tracking
        this.cameraTarget = new THREE.Vector3();
        this.cameraPosition = new THREE.Vector3();
    }
    
    createMaze() {
        const cellSize = this.maze.cellSize;
        const mazeSize = this.maze.size;
        
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(
            mazeSize * cellSize,
            mazeSize * cellSize
        );
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(
            (mazeSize * cellSize) / 2,
            0,
            (mazeSize * cellSize) / 2
        );
        this.scene.add(floor);
        
        // Create walls
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        for (let y = 0; y < mazeSize; y++) {
            for (let x = 0; x < mazeSize; x++) {
                if (this.maze.layout[y][x] === 1) {
                    const wallGeometry = new THREE.BoxGeometry(
                        cellSize,
                        WALL_HEIGHT,
                        cellSize
                    );
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(
                        x * cellSize + cellSize / 2,
                        WALL_HEIGHT / 2,
                        y * cellSize + cellSize / 2
                    );
                    this.scene.add(wall);
                }
            }
        }
    }
    
    createCar() {
        const carGeometry = new THREE.BoxGeometry(20, CAR_HEIGHT, 15);
        const carMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.carMesh = new THREE.Mesh(carGeometry, carMaterial);
        
        // Car front indicator
        const frontGeometry = new THREE.BoxGeometry(5, CAR_HEIGHT - 2, 8);
        const frontMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        const front = new THREE.Mesh(frontGeometry, frontMaterial);
        front.position.set(12, 0, 0);
        this.carMesh.add(front);
        
        this.carMesh.position.y = CAR_HEIGHT / 2;
        this.scene.add(this.carMesh);
    }
    
    createGoal() {
        const goalX = this.maze.goal.x * this.maze.cellSize;
        const goalZ = this.maze.goal.y * this.maze.cellSize;
        const goalW = this.maze.goal.width * this.maze.cellSize;
        const goalH = this.maze.goal.height * this.maze.cellSize;
        
        // Main goal platform
        const goalGeometry = new THREE.BoxGeometry(goalW, 2, goalH);
        const goalMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });
        this.goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
        this.goalMesh.position.set(
            goalX + goalW / 2,
            1,
            goalZ + goalH / 2
        );
        this.scene.add(this.goalMesh);
        
        // Goal marker (tall cylinder)
        const markerGeometry = new THREE.CylinderGeometry(5, 5, 20, 8);
        const markerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.goalMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.goalMarker.position.set(
            goalX + goalW / 2,
            10,
            goalZ + goalH / 2
        );
        this.scene.add(this.goalMarker);
    }
    
    updateCar(car) {
        // Update car position (convert 2D to 3D)
        this.carMesh.position.x = car.x;
        this.carMesh.position.z = car.y;
        
        // Update car rotation
        this.carMesh.rotation.y = -car.angle;
    }
    
    updateCamera(car) {
        // Calculate desired camera position (behind and above car, with offset)
        const angle = car.angle;
        const offsetX = Math.cos(angle - Math.PI / 2) * CAMERA_OFFSET;
        const offsetZ = Math.sin(angle - Math.PI / 2) * CAMERA_OFFSET;
        
        const targetX = car.x - Math.cos(angle) * CAMERA_DISTANCE + offsetX;
        const targetY = CAMERA_HEIGHT;
        const targetZ = car.y - Math.sin(angle) * CAMERA_DISTANCE + offsetZ;
        
        // Smooth camera movement
        this.cameraPosition.x += (targetX - this.cameraPosition.x) * CAMERA_SMOOTHING;
        this.cameraPosition.y += (targetY - this.cameraPosition.y) * CAMERA_SMOOTHING;
        this.cameraPosition.z += (targetZ - this.cameraPosition.z) * CAMERA_SMOOTHING;
        
        this.camera.position.copy(this.cameraPosition);
        
        // Look at car
        this.cameraTarget.x += (car.x - this.cameraTarget.x) * CAMERA_SMOOTHING;
        this.cameraTarget.y += (CAR_HEIGHT - this.cameraTarget.y) * CAMERA_SMOOTHING;
        this.cameraTarget.z += (car.y - this.cameraTarget.z) * CAMERA_SMOOTHING;
        
        this.camera.lookAt(this.cameraTarget);
    }
    
    animate(car) {
        // Animate goal
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        this.goalMesh.material.emissiveIntensity = pulse * 0.3;
        this.goalMarker.material.emissiveIntensity = pulse * 0.5;
        this.goalMarker.rotation.y += 0.02;
    }
    
    render(car) {
        this.updateCar(car);
        this.updateCamera(car);
        this.animate(car);
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
    
    updateMaze(maze) {
        // Clear old scene objects
        while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
        }
        
        // Re-add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
        
        // Update maze reference
        this.maze = maze;
        
        // Recreate everything
        this.createMaze();
        this.createCar();
        this.createGoal();
        
        // Update renderer size
        const size = maze.size * maze.cellSize;
        this.renderer.setSize(size, size);
    }
}

// Game state
class Game {
    constructor() {
        this.container = document.getElementById('canvas');
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
        
        // Setup 3D renderer
        this.renderer3D = new Renderer3D(this.container, this.currentMaze);
        
        this.setupInput();
        this.setupMazeSelector();
        this.restart();
        this.updateBestTimeDisplay();
        this.gameLoop();
    }

    updateCanvasSize() {
        // No longer needed - handled by Renderer3D
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
        this.renderer3D.updateMaze(this.currentMaze);
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
        // All rendering now handled by Renderer3D
        this.renderer3D.render(this.car);
        
        // Update HUD (still 2D HTML overlay)
        document.getElementById('speedometer').textContent = 
            Math.round((this.car.speed / MAX_SPEED) * 100);
        document.getElementById('timer').textContent = 
            (this.timer / 1000).toFixed(2) + 's';
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
