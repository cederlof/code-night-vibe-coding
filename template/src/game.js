// Game configuration
const config = {
    canvas: {
        width: 1200,
        height: 500
    },
    runner: {
        width: 30,
        height: 50,
        x: 10,
        speed: 3,
        jumpStrength: 12,
        gravity: 0.6
    },
    lane: {
        height: 250,
        groundY: 200
    },
    course: {
        startX: 50,
        endX: 1100
    },
    obstacles: [
        {
            width: 30,
            height: 40,
            x: 350
        },
        {
            width: 30,
            height: 40,
            x: 600
        },
        {
            width: 30,
            height: 40,
            x: 900
        }
    ],
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
        x: config.runner.x,
        y: config.lane.groundY,
        velocityY: 0,
        isJumping: false,
        isPaused: false,
        pauseEndTime: 0,
        hitObstacles: new Set(),
        obstaclesHit: 0,
        finished: false,
        finishTime: null
    },
    player2: {
        x: config.runner.x,
        y: config.lane.groundY + config.lane.height,
        velocityY: 0,
        isJumping: false,
        isPaused: false,
        pauseEndTime: 0,
        hitObstacles: new Set(),
        obstaclesHit: 0,
        finished: false,
        finishTime: null
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
        draw(); // Redraw to update display
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
    game.player1.x = config.runner.x;
    game.player1.y = config.lane.groundY;
    game.player1.velocityY = 0;
    game.player1.isJumping = false;
    game.player1.isPaused = false;
    game.player1.pauseEndTime = 0;
    game.player1.hitObstacles.clear();
    game.player1.obstaclesHit = 0;
    game.player1.finished = false;
    game.player1.finishTime = null;
    
    // Reset player 2
    game.player2.x = config.runner.x;
    game.player2.y = config.lane.groundY + config.lane.height;
    game.player2.velocityY = 0;
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
        if (event.code === 'Space') {
            jump(game.player1);
        } else if (event.code === 'ArrowUp') {
            event.preventDefault(); // Prevent page scroll
            jump(game.player2);
        }
    } else if (event.code === 'KeyR') {
        // Restart with R key
        startGame();
    }
}

function jump(player) {
    // Only jump if on the ground
    if (!player.isJumping) {
        player.velocityY = -config.runner.jumpStrength;
        player.isJumping = true;
    }
}

function updatePlayer(player, laneGroundY) {
    if (player.finished) return;
    
    const now = Date.now() / 1000;
    
    // Check if pause has ended
    if (player.isPaused) {
        if (now >= player.pauseEndTime) {
            player.isPaused = false;
        } else {
            return;
        }
    }
    
    // Move player forward
    player.x += config.runner.speed;
    
    // Apply gravity
    player.velocityY += config.runner.gravity;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y >= laneGroundY) {
        player.y = laneGroundY;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Check obstacle collision
    checkObstacleCollision(player);
    
    // Check if reached end
    if (player.x >= config.course.endX && !player.finished) {
        player.finished = true;
        player.finishTime = game.elapsedTime;
        
        // Set winner if this is the first to finish
        if (!game.winner) {
            game.winner = player === game.player1 ? 1 : 2;
        }
        
        // End game if both finished
        if (game.player1.finished && game.player2.finished) {
            endGame();
        }
    }
}

function update() {
    updatePlayer(game.player1, config.lane.groundY);
    updatePlayer(game.player2, config.lane.groundY + config.lane.height);
}

function checkObstacleCollision(player) {
    // Check collision with each obstacle
    const playerRight = player.x + config.runner.width;
    const playerBottom = player.y + config.runner.height;
    
    for (let i = 0; i < config.obstacles.length; i++) {
        const obstacle = config.obstacles[i];
        const obstacleRight = obstacle.x + obstacle.width;
        
        // Determine obstacle Y position based on which player
        const obstacleGroundY = (player === game.player1) 
            ? config.lane.groundY + 10 
            : config.lane.groundY + config.lane.height + 10;
        const obstacleBottom = obstacleGroundY + obstacle.height;
        
        if (player.x < obstacleRight &&
            playerRight > obstacle.x &&
            player.y < obstacleBottom &&
            playerBottom > obstacleGroundY) {
            
            // Collision detected!
            if (!player.isPaused && !player.hitObstacles.has(i)) {
                player.isPaused = true;
                player.pauseEndTime = (Date.now() / 1000) + config.pauseDuration;
                player.hitObstacles.add(i);
                player.obstaclesHit++;
            }
            break;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw lane divider
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, config.lane.height);
    ctx.lineTo(canvas.width, config.lane.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw ground for both lanes
    ctx.fillStyle = '#95a5a6';
    // Lane 1 ground
    ctx.fillRect(0, config.lane.groundY + config.runner.height, canvas.width, 40);
    // Lane 2 ground
    ctx.fillRect(0, config.lane.groundY + config.lane.height + config.runner.height, canvas.width, 40);
    
    // Draw start lines
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(config.course.startX, 0);
    ctx.lineTo(config.course.startX, canvas.height);
    ctx.stroke();
    
    // Draw finish lines
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(config.course.endX, 0);
    ctx.lineTo(config.course.endX, canvas.height);
    ctx.stroke();
    
    // Draw obstacles for both lanes
    ctx.fillStyle = '#e67e22';
    for (const obstacle of config.obstacles) {
        // Lane 1 obstacle
        ctx.fillRect(
            obstacle.x,
            config.lane.groundY + 10,
            obstacle.width,
            obstacle.height
        );
        // Lane 2 obstacle
        ctx.fillRect(
            obstacle.x,
            config.lane.groundY + config.lane.height + 10,
            obstacle.width,
            obstacle.height
        );
    }
    
    // Draw Player 1 (blue)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
        game.player1.x,
        game.player1.y,
        config.runner.width,
        config.runner.height
    );
    
    // Draw Player 2 (red)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
        game.player2.x,
        game.player2.y,
        config.runner.width,
        config.runner.height
    );
    
    // Draw player labels
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '16px Arial';
    ctx.fillText('P1', 10, 20);
    ctx.fillText('P2', 10, config.lane.height + 20);
    
    // Draw timer and stats
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px Arial';
    
    if (game.isRunning) {
        // Display current time during run
        ctx.fillText(`Time: ${game.elapsedTime.toFixed(2)}s`, canvas.width / 2 - 50, 30);
    } else if (game.lastRunTime !== null) {
        // Display last run time when not running
        ctx.fillText(`Last Run: ${game.lastRunTime.toFixed(2)}s`, 50, 30);
    }
    
    // Always display personal best if it exists
    if (game.personalBest !== null) {
        ctx.fillText(`Best: ${game.personalBest.toFixed(2)}s`, 50, 60);
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
    
    // Get finish times
    const p1Time = game.player1.finishTime;
    const p2Time = game.player2.finishTime;
    
    // Determine best time from this race
    const bestRaceTime = Math.min(p1Time, p2Time);
    
    // Save last run time
    game.lastRunTime = bestRaceTime;
    
    // Check if new personal best
    let isNewBest = false;
    if (game.personalBest === null || bestRaceTime < game.personalBest) {
        savePersonalBest(bestRaceTime);
        isNewBest = true;
    }
    
    startButton.disabled = false;
    startButton.textContent = 'Start';
    
    // Redraw to show stats
    draw();
    
    // Show winner announcement
    ctx.fillStyle = '#f39c12';
    ctx.font = '40px Arial';
    ctx.fillText(`Player ${game.winner} Wins!`, canvas.width / 2 - 120, canvas.height / 2 - 60);
    
    // Show both times
    ctx.fillStyle = '#3498db';
    ctx.font = '24px Arial';
    ctx.fillText(`P1: ${p1Time.toFixed(2)}s (${game.player1.obstaclesHit} hits)`, canvas.width / 2 - 140, canvas.height / 2 - 10);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`P2: ${p2Time.toFixed(2)}s (${game.player2.obstaclesHit} hits)`, canvas.width / 2 - 140, canvas.height / 2 + 25);
    
    if (isNewBest) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '20px Arial';
        ctx.fillText('NEW PERSONAL BEST!', canvas.width / 2 - 100, canvas.height / 2 + 60);
    }
    
    ctx.fillStyle = '#95a5a6';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to restart or click Start', canvas.width / 2 - 120, canvas.height / 2 + 90);
}

// Initial draw
draw();
