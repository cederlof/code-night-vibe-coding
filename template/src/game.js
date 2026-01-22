// Game configuration
const config = {
    canvas: {
        width: 1200,
        height: 400
    },
    runner: {
        width: 30,
        height: 50,
        x: 10,
        groundY: 300,
        speed: 3,
        jumpStrength: 12,
        gravity: 0.6
    },
    course: {
        startX: 50,
        endX: 1100
    },
    obstacles: [
        {
            width: 30,
            height: 40,
            x: 350,
            groundY: 310
        },
        {
            width: 30,
            height: 40,
            x: 600,
            groundY: 310
        },
        {
            width: 30,
            height: 40,
            x: 900,
            groundY: 310
        }
    ],
    pauseDuration: 0.75
};

// Game state
const game = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    obstaclesHit: 0,
    lastRunTime: null,
    personalBest: null,
    runner: {
        x: config.runner.x,
        y: config.runner.groundY,
        velocityY: 0,
        isJumping: false,
        isPaused: false,
        pauseEndTime: 0,
        hitObstacles: new Set()
    }
};

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

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = config.canvas.width;
canvas.height = config.canvas.height;

// Get UI elements
const startButton = document.getElementById('startButton');

// Event listeners
startButton.addEventListener('click', startGame);
document.addEventListener('keydown', handleKeyPress);

function startGame() {
    if (game.isRunning) return;
    
    game.isRunning = true;
    startButton.disabled = true;
    startButton.textContent = 'Running...';
    
    // Reset timer and counters
    game.startTime = Date.now();
    game.elapsedTime = 0;
    game.obstaclesHit = 0;
    
    // Reset runner position
    game.runner.x = config.runner.x;
    game.runner.y = config.runner.groundY;
    game.runner.velocityY = 0;
    game.runner.isJumping = false;
    game.runner.isPaused = false;
    game.runner.pauseEndTime = 0;
    game.runner.hitObstacles.clear();
    
    gameLoop();
}

function handleKeyPress(event) {
    if (event.code === 'Space') {
        if (game.isRunning) {
            jump();
        }
    } else if (event.code === 'KeyR') {
        // Restart with R key
        if (!game.isRunning) {
            startGame();
        }
    }
}

function jump() {
    // Only jump if on the ground
    if (!game.runner.isJumping) {
        game.runner.velocityY = -config.runner.jumpStrength;
        game.runner.isJumping = true;
    }
}

function update() {
    const now = Date.now() / 1000; // Convert to seconds
    
    // Check if pause has ended
    if (game.runner.isPaused) {
        if (now >= game.runner.pauseEndTime) {
            game.runner.isPaused = false;
        } else {
            // Still paused, don't move
            return;
        }
    }
    
    // Move runner forward
    game.runner.x += config.runner.speed;
    
    // Apply gravity
    game.runner.velocityY += config.runner.gravity;
    game.runner.y += game.runner.velocityY;
    
    // Ground collision
    if (game.runner.y >= config.runner.groundY) {
        game.runner.y = config.runner.groundY;
        game.runner.velocityY = 0;
        game.runner.isJumping = false;
    }
    
    // Check obstacle collision
    checkObstacleCollision();
    
    // Check if reached end
    if (game.runner.x >= config.course.endX) {
        endGame();
    }
}

function checkObstacleCollision() {
    // Check collision with each obstacle
    const runnerRight = game.runner.x + config.runner.width;
    const runnerBottom = game.runner.y + config.runner.height;
    
    for (let i = 0; i < config.obstacles.length; i++) {
        const obstacle = config.obstacles[i];
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleBottom = obstacle.groundY + obstacle.height;
        
        if (game.runner.x < obstacleRight &&
            runnerRight > obstacle.x &&
            game.runner.y < obstacleBottom &&
            runnerBottom > obstacle.groundY) {
            
            // Collision detected!
            if (!game.runner.isPaused && !game.runner.hitObstacles.has(i)) {
                game.runner.isPaused = true;
                game.runner.pauseEndTime = (Date.now() / 1000) + config.pauseDuration;
                game.runner.hitObstacles.add(i);
                game.obstaclesHit++;
            }
            break; // Only pause once per frame
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, config.runner.groundY + config.runner.height, canvas.width, 50);
    
    // Draw start line
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(config.course.startX, 0);
    ctx.lineTo(config.course.startX, canvas.height);
    ctx.stroke();
    
    // Draw finish line
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(config.course.endX, 0);
    ctx.lineTo(config.course.endX, canvas.height);
    ctx.stroke();
    
    // Draw obstacles
    ctx.fillStyle = '#e67e22';
    for (const obstacle of config.obstacles) {
        ctx.fillRect(
            obstacle.x,
            obstacle.groundY,
            obstacle.width,
            obstacle.height
        );
    }
    
    // Draw runner
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
        game.runner.x,
        game.runner.y,
        config.runner.width,
        config.runner.height
    );
    
    // Draw timer and stats (always visible)
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px Arial';
    
    if (game.isRunning) {
        // Display current time during run
        ctx.fillText(`Time: ${game.elapsedTime.toFixed(2)}s`, 10, 30);
    } else if (game.lastRunTime !== null) {
        // Display last run time when not running
        ctx.fillText(`Last Run: ${game.lastRunTime.toFixed(2)}s`, 10, 30);
    }
    
    // Always display personal best if it exists
    if (game.personalBest !== null) {
        ctx.fillText(`Best: ${game.personalBest.toFixed(2)}s`, 10, 60);
    }
}

function gameLoop() {
    if (!game.isRunning) return;
    
    // Update elapsed time
    game.elapsedTime = (Date.now() - game.startTime) / 1000;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    game.isRunning = false;
    const finalTime = game.elapsedTime;
    
    // Save last run time
    game.lastRunTime = finalTime;
    
    // Check if new personal best
    let isNewBest = false;
    if (game.personalBest === null || finalTime < game.personalBest) {
        savePersonalBest(finalTime);
        isNewBest = true;
    }
    
    startButton.disabled = false;
    startButton.textContent = 'Start';
    
    // Reset runner to start position
    game.runner.x = config.runner.x;
    game.runner.y = config.runner.groundY;
    game.runner.velocityY = 0;
    game.runner.isJumping = false;
    game.runner.isPaused = false;
    game.runner.pauseEndTime = 0;
    
    // Redraw to show runner at start
    draw();
    
    // Show completion stats
    ctx.fillStyle = '#2ecc71';
    ctx.font = '30px Arial';
    ctx.fillText('Finished!', canvas.width / 2 - 70, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${finalTime.toFixed(2)}s`, canvas.width / 2 - 60, canvas.height / 2);
    ctx.fillText(`Obstacles Hit: ${game.obstaclesHit}`, canvas.width / 2 - 80, canvas.height / 2 + 30);
    
    if (isNewBest) {
        ctx.fillStyle = '#f39c12';
        ctx.font = '18px Arial';
        ctx.fillText('NEW PERSONAL BEST!', canvas.width / 2 - 90, canvas.height / 2 + 60);
    }
    
    ctx.fillStyle = '#95a5a6';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to restart or click Start', canvas.width / 2 - 120, canvas.height / 2 + 90);
}

// Initial draw
draw();
