const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const CELL_SIZE = 20;
canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

let snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];

let snake2 = [
    { x: 10, y: 5 },
    { x: 11, y: 5 },
    { x: 12, y: 5 }
];

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let direction2 = { x: -1, y: 0 };
let nextDirection2 = { x: -1, y: 0 };
let gameOver = false;
let snake1Alive = true;
let snake2Alive = true;
const TICK_INTERVAL = 200;
let food = null;
let score = 0;
let score2 = 0;
let speedLevel = 1;
let startTime = Date.now();
let lastSpeedUpdate = 0;
let gameState = 'start';
let countdownValue = 3;
let isPaused = false;
let pausedTime = 0;
let pauseStartTime = 0;
let winner = null;

function getRandomEmptyCell() {
    const emptyCells = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isSnake2 = snake2.some(segment => segment.x === x && segment.y === y);
            if (!isSnake && !isSnake2) {
                emptyCells.push({ x, y });
            }
        }
    }
    
    if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    return null;
}

function spawnFood() {
    food = getRandomEmptyCell();
}

function drawGrid() {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
    }
}

function drawSnake() {
    ctx.fillStyle = '#0f0';
    
    snake.forEach((segment, index) => {
        ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        
        if (index === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffsetX = direction.x * 6;
            const eyeOffsetY = direction.y * 6;
            const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.beginPath();
            ctx.arc(
                centerX + eyeOffsetX,
                centerY + eyeOffsetY,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.fillStyle = '#0f0';
        }
    });
    
    ctx.fillStyle = '#00f';
    
    snake2.forEach((segment, index) => {
        ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        
        if (index === 0) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffsetX = direction2.x * 6;
            const eyeOffsetY = direction2.y * 6;
            const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.beginPath();
            ctx.arc(
                centerX + eyeOffsetX,
                centerY + eyeOffsetY,
                eyeSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.fillStyle = '#00f';
        }
    });
}

function drawFood() {
    if (food) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(
            food.x * CELL_SIZE,
            food.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
    }
}

function drawHUD() {
    ctx.fillStyle = '#0f0';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`P1: ${score}`, 10, 20);
    
    ctx.fillStyle = '#00f';
    ctx.fillText(`P2: ${score2}`, 10, 40);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`Level: ${speedLevel}`, 10, 60);
}

function drawStartScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE GAME', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = '20px Arial';
    ctx.fillText('2 PLAYER MODE', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#0f0';
    ctx.fillText('Player 1: Arrow Keys', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#00f';
    ctx.fillText('Player 2: WASD', canvas.width / 2, canvas.height / 2 + 15);
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Collect food to grow', canvas.width / 2, canvas.height / 2 + 45);
    ctx.fillText('Last snake alive wins!', canvas.width / 2, canvas.height / 2 + 70);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 110);
}

function drawCountdown() {
    ctx.fillStyle = '#fff';
    ctx.font = '72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(countdownValue.toString(), canvas.width / 2, canvas.height / 2 + 20);
}

function drawGameOver() {
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    
    if (winner === 'draw') {
        ctx.fillText('DRAW!', canvas.width / 2, canvas.height / 2 - 60);
    } else if (winner === 'player1') {
        ctx.fillText('PLAYER 1 WINS!', canvas.width / 2, canvas.height / 2 - 60);
    } else if (winner === 'player2') {
        ctx.fillText('PLAYER 2 WINS!', canvas.width / 2, canvas.height / 2 - 60);
    } else {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
    }
    
    ctx.font = '24px Arial';
    ctx.fillText(`Player 1 Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Player 2 Score: ${score2}`, canvas.width / 2, canvas.height / 2 + 35);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 85);
}

function drawPauseIndicator() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 50);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'countdown') {
        drawFood();
        drawSnake();
        drawCountdown();
    } else if (gameState === 'playing') {
        drawFood();
        drawSnake();
        drawHUD();
        if (isPaused) {
            drawPauseIndicator();
        }
    } else if (gameState === 'gameover') {
        drawFood();
        drawSnake();
        drawGameOver();
    }
}

function checkCollision(head) {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function checkCollisionExcludingTail(head) {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
    }
    
    for (let i = 1; i < snake.length - 1; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function checkPlayerCollisions(newHead1, newHead2, willEat1, willEat2) {
    let snake1Dies = false;
    let snake2Dies = false;
    
    if (snake1Alive && snake2Alive) {
        if (newHead1.x === newHead2.x && newHead1.y === newHead2.y) {
            snake1Dies = true;
            snake2Dies = true;
        }
    }
    
    if (snake1Alive) {
        if (newHead1.x < 0 || newHead1.x >= GRID_SIZE || newHead1.y < 0 || newHead1.y >= GRID_SIZE) {
            snake1Dies = true;
        }
        
        const checkSelfEnd = willEat1 ? snake.length : snake.length - 1;
        for (let i = 1; i < checkSelfEnd; i++) {
            if (newHead1.x === snake[i].x && newHead1.y === snake[i].y) {
                snake1Dies = true;
                break;
            }
        }
        
        if (snake2Alive) {
            for (let i = 0; i < snake2.length; i++) {
                if (newHead1.x === snake2[i].x && newHead1.y === snake2[i].y) {
                    snake1Dies = true;
                    break;
                }
            }
        }
    }
    
    if (snake2Alive) {
        if (newHead2.x < 0 || newHead2.x >= GRID_SIZE || newHead2.y < 0 || newHead2.y >= GRID_SIZE) {
            snake2Dies = true;
        }
        
        const checkSelfEnd = willEat2 ? snake2.length : snake2.length - 1;
        for (let i = 1; i < checkSelfEnd; i++) {
            if (newHead2.x === snake2[i].x && newHead2.y === snake2[i].y) {
                snake2Dies = true;
                break;
            }
        }
        
        if (snake1Alive) {
            for (let i = 0; i < snake.length; i++) {
                if (newHead2.x === snake[i].x && newHead2.y === snake[i].y) {
                    snake2Dies = true;
                    break;
                }
            }
        }
    }
    
    return { snake1Dies, snake2Dies };
}

function getCurrentTickInterval() {
    return Math.max(50, TICK_INTERVAL - (speedLevel - 1) * 20);
}

function checkSpeedIncrease() {
    const elapsedSeconds = Math.floor((Date.now() - startTime - pausedTime) / 1000);
    const newSpeedLevel = Math.floor(elapsedSeconds / 10) + 1;
    
    if (newSpeedLevel > speedLevel) {
        speedLevel = newSpeedLevel;
    }
}

function moveSnake() {
    if (gameOver || gameState !== 'playing' || isPaused) return;
    
    checkSpeedIncrease();
    
    if (snake1Alive) {
        direction = nextDirection;
    }
    if (snake2Alive) {
        direction2 = nextDirection2;
    }
    
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };
    
    const head2 = snake2[0];
    const newHead2 = { x: head2.x + direction2.x, y: head2.y + direction2.y };
    
    const willEatFood = food && newHead.x === food.x && newHead.y === food.y;
    const willEatFood2 = food && newHead2.x === food.x && newHead2.y === food.y;
    
    const collisions = checkPlayerCollisions(newHead, newHead2, willEatFood, willEatFood2);
    
    if (collisions.snake1Dies) {
        snake1Alive = false;
    }
    if (collisions.snake2Dies) {
        snake2Alive = false;
    }
    
    if (!snake1Alive && !snake2Alive) {
        gameOver = true;
        gameState = 'gameover';
        winner = 'draw';
        render();
        return;
    }
    
    if (!snake1Alive) {
        gameOver = true;
        gameState = 'gameover';
        winner = 'player2';
        render();
        return;
    }
    
    if (!snake2Alive) {
        gameOver = true;
        gameState = 'gameover';
        winner = 'player1';
        render();
        return;
    }
    
    if (snake1Alive) {
        snake.unshift(newHead);
        if (willEatFood) {
            score++;
            spawnFood();
        } else {
            snake.pop();
        }
    }
    
    if (snake2Alive) {
        snake2.unshift(newHead2);
        if (willEatFood2 && !willEatFood) {
            score2++;
            spawnFood();
        } else if (!willEatFood2) {
            snake2.pop();
        }
    }
    
    render();
    
    if (!gameOver) {
        setTimeout(moveSnake, getCurrentTickInterval());
    }
}

function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    snake2 = [
        { x: 10, y: 5 },
        { x: 11, y: 5 },
        { x: 12, y: 5 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    direction2 = { x: -1, y: 0 };
    nextDirection2 = { x: -1, y: 0 };
    gameOver = false;
    snake1Alive = true;
    snake2Alive = true;
    score = 0;
    score2 = 0;
    speedLevel = 1;
    startTime = Date.now();
    pausedTime = 0;
    isPaused = false;
    gameState = 'start';
    countdownValue = 3;
    winner = null;
    spawnFood();
    render();
}

function startCountdown() {
    gameState = 'countdown';
    countdownValue = 3;
    render();
    
    const countdownInterval = setInterval(() => {
        countdownValue--;
        
        if (countdownValue > 0) {
            render();
        } else {
            clearInterval(countdownInterval);
            gameState = 'playing';
            startTime = Date.now();
            render();
            setTimeout(moveSnake, TICK_INTERVAL);
        }
    }, 1000);
}

function handleKeyPress(e) {
    const key = e.key;
    
    if (key === ' ' && gameState === 'start') {
        startCountdown();
        return;
    }
    
    if ((key === 'r' || key === 'R') && (gameState === 'gameover' || gameState === 'start' || gameState === 'playing')) {
        resetGame();
        return;
    }
    
    if ((key === 'p' || key === 'P') && gameState === 'playing') {
        if (isPaused) {
            const pauseDuration = Date.now() - pauseStartTime;
            pausedTime += pauseDuration;
            isPaused = false;
            render();
            setTimeout(moveSnake, getCurrentTickInterval());
        } else {
            pauseStartTime = Date.now();
            isPaused = true;
            render();
        }
        return;
    }
    
    if (gameState !== 'playing' || isPaused) return;
    
    if (key === 'ArrowUp' && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if (key === 'ArrowDown' && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if (key === 'ArrowLeft' && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if (key === 'ArrowRight' && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }
    
    if ((key === 'w' || key === 'W') && direction2.y !== 1) {
        nextDirection2 = { x: 0, y: -1 };
    } else if ((key === 's' || key === 'S') && direction2.y !== -1) {
        nextDirection2 = { x: 0, y: 1 };
    } else if ((key === 'a' || key === 'A') && direction2.x !== 1) {
        nextDirection2 = { x: -1, y: 0 };
    } else if ((key === 'd' || key === 'D') && direction2.x !== -1) {
        nextDirection2 = { x: 1, y: 0 };
    }
}

document.addEventListener('keydown', handleKeyPress);

spawnFood();
render();
