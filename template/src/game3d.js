// Game configuration
const config = {
    runner: {
        width: 1,
        height: 2,
        depth: 1,
        minSpeed: 0,
        maxSpeed: 0.5,
        acceleration: 0.03,
        speedDecay: 0.002,
        jumpStrength: 0.3,
        gravity: 0.015
    },
    track: {
        width: 10,
        length: 100,
        laneWidth: 5
    },
    obstacle: {
        width: 1.5,
        height: 1.5,
        depth: 1.5,
        spacing: 15
    },
    pauseDuration: 0.75
};

// Game state
const game = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    lastRunTime: null,
    personalBest: null,
    winner: null,
    player1: {
        z: 0,
        y: 0,
        x: -2.5,
        velocityY: 0,
        speed: 0,
        lastMoveTime: 0,
        isJumping: false,
        isPaused: false,
        pauseEndTime: 0,
        hitObstacles: new Set(),
        obstaclesHit: 0,
        finished: false,
        finishTime: null,
        mesh: null
    },
    player2: {
        z: 0,
        y: 0,
        x: 2.5,
        velocityY: 0,
        speed: 0,
        lastMoveTime: 0,
        isJumping: false,
        isPaused: false,
        pauseEndTime: 0,
        hitObstacles: new Set(),
        obstaclesHit: 0,
        finished: false,
        finishTime: null,
        mesh: null
    }
};

// Three.js setup
let scene1, scene2, camera1, camera2, renderer;
let obstacles1 = [], obstacles2 = [];
let ground1, ground2;
let uiCanvas, uiCtx;

// Load personal best from local storage
function loadPersonalBest() {
    const saved = localStorage.getItem('obstacleRunnerBestTime');
    if (saved) {
        game.personalBest = parseFloat(saved);
    }
}

function savePersonalBest(time) {
    localStorage.setItem('obstacleRunnerBestTime', time.toString());
    game.personalBest = time;
}

loadPersonalBest();

// Initialize Three.js
function init3D() {
    const container = document.getElementById('gameCanvas');
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1200, 500);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    
    // Create 2D canvas overlay for UI
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = 1200;
    uiCanvas.height = 500;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.pointerEvents = 'none';
    container.style.position = 'relative';
    container.appendChild(uiCanvas);
    uiCtx = uiCanvas.getContext('2d');
    
    // Create scenes for both players
    scene1 = new THREE.Scene();
    scene1.background = new THREE.Color(0x87CEEB);
    
    scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x87CEEB);
    
    // Create cameras
    camera1 = new THREE.PerspectiveCamera(75, 600 / 500, 0.1, 1000);
    camera1.position.set(-2.5, 3, -5);
    camera1.lookAt(-2.5, 1, 10);
    
    camera2 = new THREE.PerspectiveCamera(75, 600 / 500, 0.1, 1000);
    camera2.position.set(2.5, 3, -5);
    camera2.lookAt(2.5, 1, 10);
    
    // Add lights to both scenes
    addLights(scene1);
    addLights(scene2);
    
    // Create ground for both scenes
    ground1 = createGround();
    scene1.add(ground1);
    
    ground2 = createGround();
    scene2.add(ground2);
    
    // Create player meshes
    game.player1.mesh = createPlayer(0x3498db);
    game.player1.mesh.position.set(-2.5, config.runner.height / 2, 0);
    scene1.add(game.player1.mesh);
    
    game.player2.mesh = createPlayer(0xe74c3c);
    game.player2.mesh.position.set(2.5, config.runner.height / 2, 0);
    scene2.add(game.player2.mesh);
    
    // Create obstacles
    createObstacles();
    
    // Create finish line
    createFinishLine(scene1, -2.5);
    createFinishLine(scene2, 2.5);
}

function addLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 5);
    scene.add(directionalLight);
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(config.track.width, config.track.length);
    const material = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = config.track.length / 2;
    return ground;
}

function createPlayer(color) {
    const geometry = new THREE.BoxGeometry(
        config.runner.width,
        config.runner.height,
        config.runner.depth
    );
    const material = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geometry, material);
}

function createObstacles() {
    const obstaclePositions = [20, 35, 50, 65, 80];
    
    obstaclePositions.forEach((z, index) => {
        // Obstacles for player 1
        const obstacle1 = createObstacle();
        obstacle1.position.set(-2.5, config.obstacle.height / 2, z);
        scene1.add(obstacle1);
        obstacles1.push({ mesh: obstacle1, index });
        
        // Obstacles for player 2
        const obstacle2 = createObstacle();
        obstacle2.position.set(2.5, config.obstacle.height / 2, z);
        scene2.add(obstacle2);
        obstacles2.push({ mesh: obstacle2, index });
    });
}

function createObstacle() {
    const geometry = new THREE.BoxGeometry(
        config.obstacle.width,
        config.obstacle.height,
        config.obstacle.depth
    );
    const material = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    return new THREE.Mesh(geometry, material);
}

function createFinishLine(scene, x) {
    const geometry = new THREE.BoxGeometry(config.track.width, 5, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const finishLine = new THREE.Mesh(geometry, material);
    finishLine.position.set(0, 2.5, config.track.length);
    scene.add(finishLine);
}

// Get UI elements
const startButton = document.getElementById('startButton');
const clearBestButton = document.getElementById('clearBestButton');

// Event listeners
startButton.addEventListener('click', startGame);
clearBestButton.addEventListener('click', clearBest);
document.addEventListener('keydown', handleKeyPress);

function clearBest() {
    if (confirm('Are you sure you want to clear your personal best?')) {
        localStorage.removeItem('obstacleRunnerBestTime');
        game.personalBest = null;
        game.lastRunTime = null;
    }
}

function startGame() {
    if (game.isRunning) return;
    
    game.isRunning = true;
    startButton.disabled = true;
    startButton.textContent = 'Running...';
    
    // Reset timer and counters
    game.startTime = Date.now();
    game.elapsedTime = 0;
    game.winner = null;
    
    // Reset player 1
    game.player1.z = 0;
    game.player1.y = 0;
    game.player1.velocityY = 0;
    game.player1.speed = 0;
    game.player1.lastMoveTime = 0;
    game.player1.isJumping = false;
    game.player1.isPaused = false;
    game.player1.pauseEndTime = 0;
    game.player1.hitObstacles.clear();
    game.player1.obstaclesHit = 0;
    game.player1.finished = false;
    game.player1.finishTime = null;
    
    // Reset player 2
    game.player2.z = 0;
    game.player2.y = 0;
    game.player2.velocityY = 0;
    game.player2.speed = 0;
    game.player2.lastMoveTime = 0;
    game.player2.isJumping = false;
    game.player2.isPaused = false;
    game.player2.pauseEndTime = 0;
    game.player2.hitObstacles.clear();
    game.player2.obstaclesHit = 0;
    game.player2.finished = false;
    game.player2.finishTime = null;
    
    gameLoop();
}

function handleKeyPress(event) {
    if (game.isRunning) {
        // Player 1 controls: W = jump, D = move
        if (event.code === 'KeyW') {
            jump(game.player1);
        } else if (event.code === 'KeyD') {
            acceleratePlayer(game.player1);
        }
        // Player 2 controls: Numpad 8 = jump, Numpad 6 = move
        else if (event.code === 'Numpad8') {
            jump(game.player2);
        } else if (event.code === 'Numpad6') {
            acceleratePlayer(game.player2);
        }
    } else if (event.code === 'KeyR') {
        // Restart with R key
        startGame();
    }
}

function acceleratePlayer(player) {
    const now = Date.now();
    const timeSinceLastMove = now - player.lastMoveTime;
    
    let accelerationMultiplier = 1;
    if (timeSinceLastMove < 250 && player.lastMoveTime > 0) {
        accelerationMultiplier = 2;
    } else if (timeSinceLastMove < 500 && player.lastMoveTime > 0) {
        accelerationMultiplier = 1.3;
    }
    
    player.speed = Math.min(
        config.runner.maxSpeed,
        player.speed + (config.runner.acceleration * accelerationMultiplier)
    );
    
    player.lastMoveTime = now;
}

function jump(player) {
    if (!player.isJumping && player.y <= 0.01) {
        player.velocityY = config.runner.jumpStrength;
        player.isJumping = true;
    }
}

function updatePlayer(player) {
    if (player.finished) return;
    
    const now = Date.now() / 1000;
    
    // Check if pause has ended
    if (player.isPaused) {
        if (now >= player.pauseEndTime) {
            player.isPaused = false;
        } else {
            player.speed = Math.max(config.runner.minSpeed, player.speed - config.runner.speedDecay);
            return;
        }
    }
    
    // Apply speed decay
    player.speed = Math.max(config.runner.minSpeed, player.speed - config.runner.speedDecay);
    
    // Move player forward (in Z direction)
    player.z += player.speed;
    
    // Apply gravity
    player.velocityY -= config.runner.gravity;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y <= 0) {
        player.y = 0;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Update mesh position
    if (player.mesh) {
        player.mesh.position.z = player.z;
        player.mesh.position.y = player.y + config.runner.height / 2;
    }
    
    // Check obstacle collision
    checkObstacleCollision(player);
    
    // Check if reached end
    if (player.z >= config.track.length && !player.finished) {
        player.finished = true;
        player.finishTime = game.elapsedTime;
        
        if (!game.winner) {
            game.winner = player === game.player1 ? 1 : 2;
        }
        
        if (game.player1.finished && game.player2.finished) {
            endGame();
        }
    }
}

function checkObstacleCollision(player) {
    const obstacleList = player === game.player1 ? obstacles1 : obstacles2;
    
    for (const obstacle of obstacleList) {
        if (player.hitObstacles.has(obstacle.index)) continue;
        
        const obstacleZ = obstacle.mesh.position.z;
        const playerFront = player.z + config.runner.depth / 2;
        const playerBack = player.z - config.runner.depth / 2;
        const obstacleFront = obstacleZ + config.obstacle.depth / 2;
        const obstacleBack = obstacleZ - config.obstacle.depth / 2;
        
        // Check Z overlap
        if (playerFront > obstacleBack && playerBack < obstacleFront) {
            // Check Y overlap (height)
            if (player.y < config.obstacle.height) {
                // Collision!
                if (!player.isPaused) {
                    player.isPaused = true;
                    player.pauseEndTime = (Date.now() / 1000) + config.pauseDuration;
                    player.hitObstacles.add(obstacle.index);
                    player.obstaclesHit++;
                }
                break;
            }
        }
    }
}

function update() {
    updatePlayer(game.player1);
    updatePlayer(game.player2);
    
    // Update camera positions to follow players
    camera1.position.z = game.player1.z - 5;
    camera1.lookAt(-2.5, 1, game.player1.z + 10);
    
    camera2.position.z = game.player2.z - 5;
    camera2.lookAt(2.5, 1, game.player2.z + 10);
}

function render() {
    renderer.clear();
    
    // Render player 1 viewport (left half)
    renderer.setViewport(0, 0, 600, 500);
    renderer.setScissor(0, 0, 600, 500);
    renderer.setScissorTest(true);
    renderer.render(scene1, camera1);
    
    // Render player 2 viewport (right half)
    renderer.setViewport(600, 0, 600, 500);
    renderer.setScissor(600, 0, 600, 500);
    renderer.setScissorTest(true);
    renderer.render(scene2, camera2);
    
    renderer.setScissorTest(false);
    
    // Draw UI overlay
    drawUI();
}

function drawUI() {
    // Clear UI canvas
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    
    uiCtx.fillStyle = '#ecf0f1';
    uiCtx.font = '20px Arial';
    
    if (game.isRunning) {
        uiCtx.fillText(`Time: ${game.elapsedTime.toFixed(2)}s`, 500, 30);
    } else if (game.lastRunTime !== null) {
        uiCtx.fillText(`Last: ${game.lastRunTime.toFixed(2)}s`, 50, 30);
    }
    
    if (game.personalBest !== null) {
        uiCtx.fillText(`Best: ${game.personalBest.toFixed(2)}s`, 50, 60);
    }
    
    // Player labels
    uiCtx.fillText('P1', 50, 100);
    uiCtx.fillText('P2', 650, 100);
}

function gameLoop() {
    if (!game.isRunning) return;
    
    game.elapsedTime = (Date.now() - game.startTime) / 1000;
    
    update();
    render();
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    game.isRunning = false;
    
    const p1Time = game.player1.finishTime;
    const p2Time = game.player2.finishTime;
    const bestRaceTime = Math.min(p1Time, p2Time);
    
    game.lastRunTime = bestRaceTime;
    
    let isNewBest = false;
    if (game.personalBest === null || bestRaceTime < game.personalBest) {
        savePersonalBest(bestRaceTime);
        isNewBest = true;
    }
    
    startButton.disabled = false;
    startButton.textContent = 'Start';
    
    render();
    
    // Draw end game UI
    uiCtx.fillStyle = '#f39c12';
    uiCtx.font = '40px Arial';
    uiCtx.fillText(`Player ${game.winner} Wins!`, 450, 250);
    
    uiCtx.fillStyle = '#3498db';
    uiCtx.font = '24px Arial';
    uiCtx.fillText(`P1: ${p1Time.toFixed(2)}s (${game.player1.obstaclesHit} hits)`, 420, 300);
    
    uiCtx.fillStyle = '#e74c3c';
    uiCtx.fillText(`P2: ${p2Time.toFixed(2)}s (${game.player2.obstaclesHit} hits)`, 420, 335);
    
    if (isNewBest) {
        uiCtx.fillStyle = '#2ecc71';
        uiCtx.font = '20px Arial';
        uiCtx.fillText('NEW PERSONAL BEST!', 480, 370);
    }
}

// Initialize and start
init3D();
render();
