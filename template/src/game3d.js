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
        strafeStep: 1.5,
        strafeSpeed: 0.15,
        jumpStrength: 0.3,
        gravity: 0.015
    },
    track: {
        width: 10,
        length: 100,
        laneWidth: 5,
        strafeLimit: 2
    },
    obstacle: {
        width: 1.5,
        height: 1.5,
        depth: 1.5,
        minSpacing: 8,
        minCount: 5,
        maxCount: 10,
        lanePositions: [-1.5, 0, 1.5]
    },
    pauseDuration: 0.75
};

// Game state
const game = {
    isRunning: false,
    countdown: 0,
    countdownActive: false,
    startTime: 0,
    elapsedTime: 0,
    lastRunTime: null,
    personalBest: null,
    winner: null,
    player1: {
        z: 0,
        y: 0,
        x: -2.5,
        targetX: 0,
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
        mesh: null,
        cameraShake: 0
    },
    player2: {
        z: 0,
        y: 0,
        x: 2.5,
        targetX: 0,
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
        mesh: null,
        cameraShake: 0
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    camera1.position.set(0, 3, -5);
    camera1.lookAt(0, 1, 10);
    
    camera2 = new THREE.PerspectiveCamera(75, 600 / 500, 0.1, 1000);
    camera2.position.set(0, 3, -5);
    camera2.lookAt(0, 1, 10);
    
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
    game.player1.mesh.position.set(0, config.runner.height / 2, 0);
    scene1.add(game.player1.mesh);
    
    game.player2.mesh = createPlayer(0xe74c3c);
    game.player2.mesh.position.set(0, config.runner.height / 2, 0);
    scene2.add(game.player2.mesh);
    
    // Create obstacles
    createObstacles();
    
    // Create finish line
    createFinishLine(scene1, 0);
    createFinishLine(scene2, 0);
    
    // Create side barriers
    createBarriers(scene1);
    createBarriers(scene2);
}

function addLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Spotlight following player
    const spotlight = new THREE.SpotLight(0xffffff, 0.5);
    spotlight.position.set(0, 10, 0);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.3;
    spotlight.decay = 2;
    spotlight.distance = 50;
    spotlight.castShadow = true;
    scene.add(spotlight);
    scene.userData.spotlight = spotlight;
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(config.track.width, config.track.length);
    
    // Create texture using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    const gridSize = 64;
    for (let i = 0; i <= 512; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 10);
    
    const material = new THREE.MeshLambertMaterial({ map: texture });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = config.track.length / 2;
    ground.receiveShadow = true;
    return ground;
}

function createPlayer(color) {
    const geometry = new THREE.BoxGeometry(
        config.runner.width,
        config.runner.height,
        config.runner.depth
    );
    const material = new THREE.MeshLambertMaterial({ color });
    const player = new THREE.Mesh(geometry, material);
    player.castShadow = true;
    player.receiveShadow = true;
    return player;
}

function generateRandomObstaclePositions() {
    const positions = [];
    const obstacleCount = Math.floor(Math.random() * (config.obstacle.maxCount - config.obstacle.minCount + 1)) + config.obstacle.minCount;
    
    let currentZ = 15; // Start obstacles after some distance
    
    for (let i = 0; i < obstacleCount; i++) {
        // Random X position from lane positions
        const xIndex = Math.floor(Math.random() * config.obstacle.lanePositions.length);
        const x = config.obstacle.lanePositions[xIndex];
        
        // Add random spacing between min and max
        const spacing = config.obstacle.minSpacing + Math.random() * 5;
        currentZ += spacing;
        
        // Make sure we don't go beyond track length
        if (currentZ < config.track.length - 5) {
            positions.push({ x, z: currentZ });
        }
    }
    
    return positions;
}

function createObstacles() {
    const obstaclePositions = generateRandomObstaclePositions();
    
    obstaclePositions.forEach((pos, index) => {
        // Obstacles for player 1
        const obstacle1 = createObstacle();
        obstacle1.position.set(pos.x, config.obstacle.height / 2, pos.z);
        scene1.add(obstacle1);
        obstacles1.push({ mesh: obstacle1, index });
        
        // Obstacles for player 2
        const obstacle2 = createObstacle();
        obstacle2.position.set(pos.x, config.obstacle.height / 2, pos.z);
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
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    obstacle.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
    return obstacle;
}

function createFinishLine(scene, x) {
    const geometry = new THREE.BoxGeometry(config.track.width, 5, 0.5);
    const material = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const finishLine = new THREE.Mesh(geometry, material);
    finishLine.position.set(0, 2.5, config.track.length);
    finishLine.castShadow = true;
    finishLine.receiveShadow = true;
    scene.add(finishLine);
}

function createBarriers(scene) {
    const barrierHeight = 3;
    const barrierThickness = 0.3;
    const geometry = new THREE.BoxGeometry(barrierThickness, barrierHeight, config.track.length);
    const material = new THREE.MeshLambertMaterial({ color: 0x34495e, transparent: true, opacity: 0.6 });
    
    // Left barrier
    const leftBarrier = new THREE.Mesh(geometry, material);
    leftBarrier.position.set(-config.track.width / 2, barrierHeight / 2, config.track.length / 2);
    leftBarrier.castShadow = true;
    leftBarrier.receiveShadow = true;
    scene.add(leftBarrier);
    
    // Right barrier
    const rightBarrier = new THREE.Mesh(geometry, material);
    rightBarrier.position.set(config.track.width / 2, barrierHeight / 2, config.track.length / 2);
    rightBarrier.castShadow = true;
    rightBarrier.receiveShadow = true;
    scene.add(rightBarrier);
}

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playSoundEffect(effect) {
    switch(effect) {
        case 'jump':
            playSound(300, 0.1, 'sine');
            break;
        case 'landing':
            playSound(150, 0.05, 'sine');
            break;
        case 'collision':
            playSound(100, 0.2, 'sawtooth');
            break;
        case 'strafe':
            playSound(200, 0.05, 'triangle');
            break;
        case 'accelerate':
            playSound(250, 0.03, 'square');
            break;
        case 'winner':
            playSound(440, 0.1, 'sine');
            setTimeout(() => playSound(554, 0.1, 'sine'), 100);
            setTimeout(() => playSound(659, 0.2, 'sine'), 200);
            break;
        case 'countdown':
            playSound(600, 0.1, 'sine');
            break;
        case 'go':
            playSound(800, 0.15, 'sine');
            break;
    }
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
    
    // Clear existing obstacles
    obstacles1.forEach(obs => scene1.remove(obs.mesh));
    obstacles2.forEach(obs => scene2.remove(obs.mesh));
    obstacles1 = [];
    obstacles2 = [];
    
    // Generate new random obstacle course
    createObstacles();
    
    // Reset timer and counters
    game.startTime = Date.now();
    game.elapsedTime = 0;
    game.winner = null;
    
    // Reset player 1
    game.player1.z = 0;
    game.player1.y = 0;
    game.player1.x = 0;
    game.player1.targetX = 0;
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
    game.player2.x = 0;
    game.player2.targetX = 0;
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
    game.player1.cameraShake = 0;
    game.player2.cameraShake = 0;
    
    // Start countdown
    game.countdownActive = true;
    game.countdown = 3;
    game.isRunning = false; // Temporarily pause until countdown finishes
    
    const countdownInterval = setInterval(() => {
        if (game.countdown > 0) {
            playSoundEffect('countdown');
            game.countdown--;
        } else {
            playSoundEffect('go');
            game.countdownActive = false;
            game.isRunning = true;
            game.startTime = Date.now();
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    gameLoop();
}

function handleKeyPress(event) {
    if (game.isRunning) {
        // Player 1 controls: W = forward, D = strafe left, A = strafe right
        if (event.code === 'KeyW') {
            acceleratePlayer(game.player1);
        } else if (event.code === 'KeyD') {
            strafePlayer(game.player1, -1);
        } else if (event.code === 'KeyA') {
            strafePlayer(game.player1, 1);
        }
        // Player 2 controls: Numpad 8 = forward, Numpad 6 = strafe left, Numpad 4 = strafe right
        else if (event.code === 'Numpad8') {
            acceleratePlayer(game.player2);
        } else if (event.code === 'Numpad6') {
            strafePlayer(game.player2, -1);
        } else if (event.code === 'Numpad4') {
            strafePlayer(game.player2, 1);
        }
    } else if (event.code === 'KeyR') {
        // Restart with R key
        startGame();
    }
}

function acceleratePlayer(player) {
    const now = Date.now();
    const timeSinceLastMove = now - player.lastMoveTime;
    
    playSoundEffect('accelerate');
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

function strafePlayer(player, direction) {
    // direction: -1 for left, 1 for right
    const newTargetX = player.targetX + (direction * config.runner.strafeStep);
    
    // Apply lane boundaries
    if (Math.abs(newTargetX) <= config.track.strafeLimit) {
        player.targetX = newTargetX;
        playSoundEffect('strafe');
    }
}

function jump(player) {
    if (!player.isJumping && player.y <= 0.01) {
        player.velocityY = config.runner.jumpStrength;
        player.isJumping = true;
        playSoundEffect('jump');
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
    
    // Smooth strafe interpolation (lerp towards target)
    const xDiff = player.targetX - player.x;
    if (Math.abs(xDiff) > 0.01) {
        player.x += xDiff * config.runner.strafeSpeed;
    } else {
        player.x = player.targetX;
    }
    
    // Apply gravity
    player.velocityY -= config.runner.gravity;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y <= 0) {
        player.y = 0;
        if (player.velocityY < -0.1) {
            playSoundEffect('landing');
        }
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Reduce camera shake
    if (player.cameraShake > 0) {
        player.cameraShake *= 0.9;
        if (player.cameraShake < 0.01) player.cameraShake = 0;
    }
    
    // Update mesh position
    if (player.mesh) {
        player.mesh.position.x = player.x;
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
        const obstacleX = obstacle.mesh.position.x;
        
        const playerFront = player.z + config.runner.depth / 2;
        const playerBack = player.z - config.runner.depth / 2;
        const obstacleFront = obstacleZ + config.obstacle.depth / 2;
        const obstacleBack = obstacleZ - config.obstacle.depth / 2;
        
        // Check Z overlap
        if (playerFront > obstacleBack && playerBack < obstacleFront) {
            // Check X overlap (horizontal position)
            const playerLeft = player.x - config.runner.width / 2;
            const playerRight = player.x + config.runner.width / 2;
            const obstacleLeft = obstacleX - config.obstacle.width / 2;
            const obstacleRight = obstacleX + config.obstacle.width / 2;
            
            if (playerRight > obstacleLeft && playerLeft < obstacleRight) {
                // Check Y overlap (height)
                if (player.y < config.obstacle.height) {
                    // Collision!
                    if (!player.isPaused) {
                        player.isPaused = true;
                        player.pauseEndTime = (Date.now() / 1000) + config.pauseDuration;
                        player.hitObstacles.add(obstacle.index);
                        player.obstaclesHit++;
                        player.cameraShake = 0.3;
                        playSoundEffect('collision');
                        
                        // Flash obstacle red
                        const originalColor = obstacle.mesh.material.color.getHex();
                        obstacle.mesh.material.color.setHex(0xff0000);
                        setTimeout(() => {
                            obstacle.mesh.material.color.setHex(originalColor);
                        }, 200);
                    }
                    break;
                }
            }
        }
    }
}

function update() {
    updatePlayer(game.player1);
    updatePlayer(game.player2);
    
    // Update camera positions with smooth follow and shake
    const shake1X = (Math.random() - 0.5) * game.player1.cameraShake;
    const shake1Y = (Math.random() - 0.5) * game.player1.cameraShake;
    camera1.position.x = game.player1.x + shake1X;
    camera1.position.y = 3 + shake1Y;
    camera1.position.z = game.player1.z - 5;
    camera1.lookAt(game.player1.x, 1, game.player1.z + 10);
    
    const shake2X = (Math.random() - 0.5) * game.player2.cameraShake;
    const shake2Y = (Math.random() - 0.5) * game.player2.cameraShake;
    camera2.position.x = game.player2.x + shake2X;
    camera2.position.y = 3 + shake2Y;
    camera2.position.z = game.player2.z - 5;
    camera2.lookAt(game.player2.x, 1, game.player2.z + 10);
    
    // Update spotlight positions to follow players
    if (scene1.userData.spotlight) {
        scene1.userData.spotlight.position.set(game.player1.x, 10, game.player1.z + 5);
        scene1.userData.spotlight.target.position.set(game.player1.x, 0, game.player1.z);
        scene1.userData.spotlight.target.updateMatrixWorld();
    }
    if (scene2.userData.spotlight) {
        scene2.userData.spotlight.position.set(game.player2.x, 10, game.player2.z + 5);
        scene2.userData.spotlight.target.position.set(game.player2.x, 0, game.player2.z);
        scene2.userData.spotlight.target.updateMatrixWorld();
    }
    
    // Animate obstacles (rotation)
    obstacles1.forEach(obs => {
        obs.mesh.rotation.y += obs.mesh.userData.rotationSpeed;
    });
    obstacles2.forEach(obs => {
        obs.mesh.rotation.y += obs.mesh.userData.rotationSpeed;
    });
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
    
    // Countdown display
    if (game.countdownActive) {
        uiCtx.fillStyle = '#f39c12';
        uiCtx.font = 'bold 120px Arial';
        uiCtx.textAlign = 'center';
        if (game.countdown > 0) {
            uiCtx.fillText(game.countdown, 600, 300);
        } else {
            uiCtx.fillStyle = '#2ecc71';
            uiCtx.fillText('GO!', 600, 300);
        }
        uiCtx.textAlign = 'left';
        return;
    }
    
    // Player 1 HUD (left side)
    uiCtx.fillStyle = '#3498db';
    uiCtx.font = 'bold 24px Arial';
    uiCtx.fillText('PLAYER 1', 20, 30);
    
    if (game.isRunning && !game.player1.finished) {
        uiCtx.fillStyle = '#ecf0f1';
        uiCtx.font = '20px Arial';
        uiCtx.fillText(`Time: ${game.elapsedTime.toFixed(2)}s`, 20, 60);
        uiCtx.fillText(`Speed: ${(game.player1.speed * 100).toFixed(0)}%`, 20, 85);
        uiCtx.fillText(`Hits: ${game.player1.obstaclesHit}`, 20, 110);
    }
    
    // Player 2 HUD (right side)
    uiCtx.fillStyle = '#e74c3c';
    uiCtx.font = 'bold 24px Arial';
    uiCtx.fillText('PLAYER 2', 1020, 30);
    
    if (game.isRunning && !game.player2.finished) {
        uiCtx.fillStyle = '#ecf0f1';
        uiCtx.font = '20px Arial';
        uiCtx.fillText(`Time: ${game.elapsedTime.toFixed(2)}s`, 1020, 60);
        uiCtx.fillText(`Speed: ${(game.player2.speed * 100).toFixed(0)}%`, 1020, 85);
        uiCtx.fillText(`Hits: ${game.player2.obstaclesHit}`, 1020, 110);
    }
    
    // Personal best (center)
    if (game.personalBest !== null) {
        uiCtx.fillStyle = '#f39c12';
        uiCtx.font = '18px Arial';
        uiCtx.textAlign = 'center';
        uiCtx.fillText(`Best: ${game.personalBest.toFixed(2)}s`, 600, 30);
        uiCtx.textAlign = 'left';
    }
}

function gameLoop() {
    if (!game.isRunning && !game.countdownActive) return;
    
    if (game.isRunning) {
        game.elapsedTime = (Date.now() - game.startTime) / 1000;
    }
    
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
    
    // Play winner sound
    playSoundEffect('winner');
    
    render();
    
    // Draw end game UI
    uiCtx.fillStyle = '#f39c12';
    uiCtx.font = 'bold 48px Arial';
    uiCtx.textAlign = 'center';
    uiCtx.fillText(`Player ${game.winner} Wins!`, 600, 250);
    
    uiCtx.fillStyle = '#3498db';
    uiCtx.font = '28px Arial';
    uiCtx.fillText(`P1: ${p1Time.toFixed(2)}s (${game.player1.obstaclesHit} hits)`, 600, 300);
    
    uiCtx.fillStyle = '#e74c3c';
    uiCtx.fillText(`P2: ${p2Time.toFixed(2)}s (${game.player2.obstaclesHit} hits)`, 600, 340);
    
    if (isNewBest) {
        uiCtx.fillStyle = '#2ecc71';
        uiCtx.font = 'bold 24px Arial';
        uiCtx.fillText('NEW PERSONAL BEST!', 600, 385);
    }
    
    uiCtx.textAlign = 'left';
}

// Initialize and start
init3D();
render();
