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
        length: 200,
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
        ghostMesh: null,
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
        ghostMesh: null,
        cameraShake: 0
    }
};

// Three.js setup
let scene1, scene2, camera1, camera2, renderer;
let obstacles1 = [], obstacles2 = [];
let ground1, ground2;
let finishBanner1, finishBanner2;
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
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
    
    // Create scenes for both players with gradient sky
    scene1 = new THREE.Scene();
    scene1.background = new THREE.Color(0x87CEEB);
    scene1.fog = new THREE.Fog(0x87CEEB, 50, 120);
    
    scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x87CEEB);
    scene2.fog = new THREE.Fog(0x87CEEB, 50, 120);
    
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
    
    // Create ghost of player 2 in player 1's scene
    game.player2.ghostMesh = createGhostPlayer(0xe74c3c);
    game.player2.ghostMesh.position.set(0, config.runner.height / 2, 0);
    scene1.add(game.player2.ghostMesh);
    
    game.player2.mesh = createPlayer(0xe74c3c);
    game.player2.mesh.position.set(0, config.runner.height / 2, 0);
    scene2.add(game.player2.mesh);
    
    // Create ghost of player 1 in player 2's scene
    game.player1.ghostMesh = createGhostPlayer(0x3498db);
    game.player1.ghostMesh.position.set(0, config.runner.height / 2, 0);
    scene2.add(game.player1.ghostMesh);
    
    // Create obstacles
    createObstacles();
    
    // Create finish line
    finishBanner1 = createFinishLine(scene1, 'FINISH');
    finishBanner2 = createFinishLine(scene2, 'FINISH');
    
    // Create side barriers
    createBarriers(scene1);
    createBarriers(scene2);
    
    // Create landscaping
    createLandscaping(scene1);
    createLandscaping(scene2);
}

function addLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(15, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Hemisphere light for more natural lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x808080, 0.3);
    scene.add(hemiLight);
    
    // Spotlight following player
    const spotlight = new THREE.SpotLight(0xffffff, 0.6);
    spotlight.position.set(0, 12, 0);
    spotlight.angle = Math.PI / 5;
    spotlight.penumbra = 0.4;
    spotlight.decay = 1.5;
    spotlight.distance = 60;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    scene.add(spotlight);
    scene.userData.spotlight = spotlight;
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(config.track.width, config.track.length);
    
    // Create more detailed texture using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base track color with gradient
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, '#5a6268');
    gradient.addColorStop(0.5, '#6c757d');
    gradient.addColorStop(1, '#5a6268');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add texture noise for asphalt effect
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 2;
        const alpha = Math.random() * 0.3;
        ctx.fillStyle = `rgba(${Math.random() * 50}, ${Math.random() * 50}, ${Math.random() * 50}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }
    
    // Lane markings
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 8;
    ctx.setLineDash([40, 30]);
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();
    
    // Side lines
    ctx.setLineDash([]);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ffc107';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(924, 0);
    ctx.lineTo(924, 1024);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 10);
    
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = config.track.length / 2;
    ground.receiveShadow = true;
    return ground;
}

function createPlayer(color) {
    const group = new THREE.Group();
    
    // Main body - sleek wedge shape
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Front nose cone
    const noseGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.2, 0.9);
    nose.castShadow = true;
    group.add(nose);
    
    // Cockpit/windshield
    const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.6
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.4, 0.2);
    cockpit.castShadow = true;
    group.add(cockpit);
    
    // Side wings/fins
    const wingGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.4,
        metalness: 0.6
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0.15, 0);
    leftWing.castShadow = true;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0.15, 0);
    rightWing.castShadow = true;
    group.add(rightWing);
    
    // Rear engine glow
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const engineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00d4ff,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.8
    });
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.3, 0.1, -0.7);
    group.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.3, 0.1, -0.7);
    group.add(rightEngine);
    
    return group;
}

function createGhostPlayer(color) {
    const group = new THREE.Group();
    
    // Main body - sleek wedge shape (transparent)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.25
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.2;
    body.castShadow = false;
    body.receiveShadow = false;
    group.add(body);
    
    // Front nose cone (transparent)
    const noseGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.25
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.2, 0.9);
    nose.castShadow = false;
    group.add(nose);
    
    // Cockpit/windshield (transparent)
    const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.2
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.4, 0.2);
    cockpit.castShadow = false;
    group.add(cockpit);
    
    // Side wings/fins (transparent)
    const wingGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.25
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0.15, 0);
    leftWing.castShadow = false;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0.15, 0);
    rightWing.castShadow = false;
    group.add(rightWing);
    
    // Rear engine glow (transparent)
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const engineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00d4ff,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.25
    });
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.3, 0.1, -0.7);
    group.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.3, 0.1, -0.7);
    group.add(rightEngine);
    
    return group;
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
    const colors = [0xe74c3c, 0xe67e22, 0xf39c12, 0xc0392b];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const geometry = new THREE.BoxGeometry(
        config.obstacle.width,
        config.obstacle.height,
        config.obstacle.depth
    );
    
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.7,
        metalness: 0.3,
        emissive: color,
        emissiveIntensity: 0.2
    });
    
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    obstacle.userData.rotationSpeed = (Math.random() - 0.5) * 0.02;
    
    // Add edge glow
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    obstacle.add(wireframe);
    
    return obstacle;
}

function createFinishLine(scene, bannerText) {
    const group = new THREE.Group();
    
    // Create checkered finish line on ground
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const squareSize = 32;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 2; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#000000' : '#ffffff';
            ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const lineGeometry = new THREE.PlaneGeometry(config.track.width, 2);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8,
        metalness: 0.1
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.01, config.track.length);
    line.receiveShadow = true;
    group.add(line);
    
    // Create finish arch
    const archHeight = 6;
    const archWidth = config.track.width + 2;
    
    // Left pillar
    const pillarGeometry = new THREE.BoxGeometry(0.8, archHeight, 0.8);
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe74c3c,
        roughness: 0.5,
        metalness: 0.3
    });
    const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    leftPillar.position.set(-archWidth / 2, archHeight / 2, config.track.length);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    group.add(leftPillar);
    
    // Right pillar
    const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    rightPillar.position.set(archWidth / 2, archHeight / 2, config.track.length);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    group.add(rightPillar);
    
    // Top bar
    const barGeometry = new THREE.BoxGeometry(archWidth, 0.6, 0.8);
    const barMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf39c12,
        roughness: 0.4,
        metalness: 0.5,
        emissive: 0xf39c12,
        emissiveIntensity: 0.3
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(0, archHeight - 0.3, config.track.length);
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);
    
    // Finish banner with dynamic text
    const banner = createBannerMesh(bannerText, archWidth);
    banner.position.set(0, archHeight - 1.5, config.track.length);
    banner.receiveShadow = true;
    group.add(banner);
    
    scene.add(group);
    return banner;
}

function createBannerMesh(text, archWidth) {
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bannerCtx = bannerCanvas.getContext('2d');
    
    // Flip canvas horizontally so text reads correctly
    bannerCtx.translate(512, 0);
    bannerCtx.scale(-1, 1);
    
    bannerCtx.fillStyle = '#2c3e50';
    bannerCtx.fillRect(0, 0, 512, 128);
    bannerCtx.fillStyle = '#ffffff';
    bannerCtx.font = 'bold 60px Arial';
    bannerCtx.textAlign = 'center';
    bannerCtx.fillText(text, 256, 80);
    
    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeometry = new THREE.PlaneGeometry(archWidth - 2, 1.2);
    const bannerMaterial = new THREE.MeshStandardMaterial({ 
        map: bannerTexture,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.userData.canvas = bannerCanvas;
    banner.userData.context = bannerCtx;
    return banner;
}

function updateBannerText(banner, text) {
    const ctx = banner.userData.context;
    const canvas = banner.userData.canvas;
    
    // Clear and redraw
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 80);
    
    // Update texture
    banner.material.map.needsUpdate = true;
}

function createBarriers(scene) {
    const barrierHeight = 3;
    const barrierThickness = 0.3;
    const geometry = new THREE.BoxGeometry(barrierThickness, barrierHeight, config.track.length);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xecf0f1,
        roughness: 0.5,
        metalness: 0.5,
        transparent: true,
        opacity: 0.7
    });
    
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

function createLandscaping(scene) {
    const spacing = 8; // Distance between landscape objects
    const sideDistance = config.track.width / 2 + 2; // Position outside barriers
    
    for (let z = 0; z < config.track.length; z += spacing) {
        // Randomly choose bush or tree for variety
        const isBush = Math.random() > 0.5;
        
        // Left side
        const leftLandscape = isBush ? createBush() : createTree();
        leftLandscape.position.set(-sideDistance - Math.random() * 2, 0, z + Math.random() * 3);
        leftLandscape.rotation.y = Math.random() * Math.PI * 2;
        scene.add(leftLandscape);
        
        // Right side
        const rightLandscape = isBush ? createBush() : createTree();
        rightLandscape.position.set(sideDistance + Math.random() * 2, 0, z + Math.random() * 3);
        rightLandscape.rotation.y = Math.random() * Math.PI * 2;
        scene.add(rightLandscape);
    }
}

function createBush() {
    const group = new THREE.Group();
    
    // Bush base (sphere)
    const bushGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const bushMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x27ae60,
        roughness: 0.9,
        metalness: 0.0
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.y = 0.6;
    bush.scale.y = 0.7;
    bush.castShadow = true;
    bush.receiveShadow = true;
    group.add(bush);
    
    // Add smaller accent bushes
    const accent1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x229954, roughness: 0.9 })
    );
    accent1.position.set(0.5, 0.5, 0.3);
    accent1.castShadow = true;
    group.add(accent1);
    
    return group;
}

function createTree() {
    const group = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 12);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6d4c41,
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    // Tree foliage (layered cones)
    const foliageMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2ecc71,
        roughness: 0.85,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    
    const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 12), foliageMaterial);
    foliage1.position.y = 2.5;
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    group.add(foliage1);
    
    const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 12), foliageMaterial);
    foliage2.position.y = 3.5;
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    group.add(foliage2);
    
    const foliage3 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 12), foliageMaterial);
    foliage3.position.y = 4.3;
    foliage3.castShadow = true;
    foliage3.receiveShadow = true;
    group.add(foliage3);
    
    return group;
}

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bgMusicOscillators = [];
let bgMusicGain = null;

function startBackgroundMusic() {
    stopBackgroundMusic();
    
    // Create gain node for volume control
    bgMusicGain = audioContext.createGain();
    bgMusicGain.gain.setValueAtTime(0.15, audioContext.currentTime);
    bgMusicGain.connect(audioContext.destination);
    
    // Bass line pattern (repeating notes)
    const bassNotes = [110, 110, 165, 165, 147, 147, 131, 196];
    const bassInterval = 0.4;
    
    function playBassNote(index) {
        if (!bgMusicGain) return;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = bassNotes[index % bassNotes.length];
        
        osc.connect(gain);
        gain.connect(bgMusicGain);
        
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + bassInterval);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + bassInterval);
        
        setTimeout(() => playBassNote(index + 1), bassInterval * 1000);
    }
    
    // Melody line (higher pitched)
    const melodyNotes = [440, 494, 523, 587, 523, 494, 440, 392];
    const melodyInterval = 0.2;
    
    function playMelodyNote(index) {
        if (!bgMusicGain) return;
        
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.value = melodyNotes[index % melodyNotes.length];
        
        osc.connect(gain);
        gain.connect(bgMusicGain);
        
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + melodyInterval);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + melodyInterval);
        
        setTimeout(() => playMelodyNote(index + 1), melodyInterval * 1000);
    }
    
    // Pad/atmosphere
    const padFreq = 220;
    const pad = audioContext.createOscillator();
    const padGain = audioContext.createGain();
    
    pad.type = 'sine';
    pad.frequency.value = padFreq;
    pad.connect(padGain);
    padGain.connect(bgMusicGain);
    padGain.gain.setValueAtTime(0.05, audioContext.currentTime);
    
    pad.start();
    bgMusicOscillators.push(pad);
    
    // Start the patterns
    playBassNote(0);
    setTimeout(() => playMelodyNote(0), 100);
}

function stopBackgroundMusic() {
    bgMusicOscillators.forEach(osc => {
        try {
            osc.stop();
        } catch(e) {}
    });
    bgMusicOscillators = [];
    bgMusicGain = null;
}

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
    
    // Reset finish banners
    updateBannerText(finishBanner1, 'FINISH');
    updateBannerText(finishBanner2, 'FINISH');
    
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
            startBackgroundMusic();
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
    
    // Update ghost player positions
    if (game.player1.ghostMesh) {
        game.player1.ghostMesh.position.x = game.player1.x;
        game.player1.ghostMesh.position.z = game.player1.z;
        game.player1.ghostMesh.position.y = game.player1.y + config.runner.height / 2;
    }
    if (game.player2.ghostMesh) {
        game.player2.ghostMesh.position.x = game.player2.x;
        game.player2.ghostMesh.position.z = game.player2.z;
        game.player2.ghostMesh.position.y = game.player2.y + config.runner.height / 2;
    }
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
    stopBackgroundMusic();
    
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
    
    // Update finish banners to show winner
    updateBannerText(finishBanner1, `P${game.winner} WINS!`);
    updateBannerText(finishBanner2, `P${game.winner} WINS!`);
    
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
