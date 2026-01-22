// Game configuration
const config = {
    canvas: {
        width: 800,
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
        endX: 750
    }
};

// Game state
const game = {
    isRunning: false,
    runner: {
        x: config.runner.x,
        y: config.runner.groundY,
        velocityY: 0,
        isJumping: false
    }
};

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
    
    // Reset runner position
    game.runner.x = config.runner.x;
    game.runner.y = config.runner.groundY;
    game.runner.velocityY = 0;
    game.runner.isJumping = false;
    
    gameLoop();
}

function handleKeyPress(event) {
    if (event.code === 'Space' && game.isRunning) {
        jump();
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
    
    // Check if reached end
    if (game.runner.x >= config.course.endX) {
        endGame();
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
    
    // Draw runner
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
        game.runner.x,
        game.runner.y,
        config.runner.width,
        config.runner.height
    );
}

function gameLoop() {
    if (!game.isRunning) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    game.isRunning = false;
    startButton.disabled = false;
    startButton.textContent = 'Start';
    
    // Show completion message
    ctx.fillStyle = '#2ecc71';
    ctx.font = '30px Arial';
    ctx.fillText('Finished!', canvas.width / 2 - 60, canvas.height / 2);
}

// Initial draw
draw();
