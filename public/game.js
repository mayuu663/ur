// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const playerImgFront = new Image();
const playerImgLeft = new Image();
const playerImgRight = new Image();
const playerImgHeart = new Image();
playerImgFront.src = 'front.png';
playerImgLeft.src = 'left.png';
playerImgRight.src = 'right.png';
playerImgHeart.src = 'heart.png';

const enemyImg1 = new Image();
const enemyImg2 = new Image();
enemyImg1.src = 'note-cute1.png';
enemyImg2.src = 'note-cute2.png';

const bulletImg = new Image();
bulletImg.src = 'bullet.png';

let currentImg = playerImgFront;

const player = {
  x: 180,
  y: 500,
  width: 60,
  height: 60,
  speed: 5
};

let bullets = [];
let enemies = [];
let effects = [];
let score = 0;
let moveLeft = false;
let moveRight = false;
let lastShotTime = 0;
let gameTime = 30;
let gameInterval;
let enemySpawnInterval;
let bonusTime = false;
const shotCooldown = 250;

const timerDisplay = document.getElementById('timerDisplay');
timerDisplay.style.left = '300px';
timerDisplay.style.top = '10px';
const resultDisplay = document.getElementById('result');

function getTitle(score) {
  if (score >= 150) return '🌈 神話級アイドル砲神👑';
  if (score >= 100) return '💥 超次元アイドル破壊王';
  if (score >= 90) return '🔥 爆裂全弾命中マスター';
  if (score >= 80) return '💫 音速超えのスターシューター';
  if (score >= 70) return '🚀 超絶反応アド連射姫';
  if (score >= 60) return '🌟 極限かわいさ連打職人';
  if (score >= 50) return '👑 爆アドシューティング神！';
  if (score >= 40) return '💫 超連射の鬼';
  if (score >= 30) return '💪 本気のアイドル';
  if (score >= 20) return '🌟 シューティング見習い';
  if (score >= 10) return '🥚 まだまだこれから！';
  return '😢 撃たれ放題アイドル候補生';
}

function resetGame() {
  bullets = [];
  enemies = [];
  effects = [];
  score = 0;
  moveLeft = false;
  moveRight = false;
  lastShotTime = 0;
  gameTime = 30;
  currentImg = playerImgFront;
  resultDisplay.innerHTML = '';
  resultDisplay.style.display = 'none';
}

function drawPlayer() {
  ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  bullets.forEach((b) => {
    ctx.drawImage(bulletImg, b.x - 10, b.y - 10, 20, 20);
  });
}

function drawEnemies() {
  enemies.forEach((e) => {
    const img = e.type === 1 ? enemyImg1 : enemyImg2;
    ctx.drawImage(img, e.x, e.y, e.width, e.height);
  });
}

function drawEffects() {
  effects.forEach((fx, i) => {
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,192,203,${fx.alpha})`;
    ctx.fill();
  });
}

function updateBullets() {
  bullets.forEach((b, index) => {
    b.y -= b.speed;
    if (b.y < 0) bullets.splice(index, 1);
  });
}

function updateEnemies() {
  enemies.forEach((e, index) => {
    e.y += e.speedY;
    e.x += e.speedX;
    if (e.x < 0 || e.x > canvas.width - e.width) e.speedX *= -1;
    if (e.y > canvas.height) enemies.splice(index, 1);
  });
}

function updateEffects() {
  effects.forEach((fx, i) => {
    fx.alpha -= 0.05;
    fx.size += 1;
    if (fx.alpha <= 0) effects.splice(i, 1);
  });
}

function detectCollisions() {
  bullets.forEach((b, bIndex) => {
    enemies.forEach((e, eIndex) => {
      if (
        b.x > e.x &&
        b.x < e.x + e.width &&
        b.y > e.y &&
        b.y < e.y + e.height
      ) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        effects.push({ x: b.x, y: b.y, size: 5, alpha: 1 });
        score++;
      }
    });
  });
}

function drawScore() {
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  ctx.fillText(`スコア: ${score}`, 10, 30);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (moveLeft) player.x = Math.max(0, player.x - player.speed);
  if (moveRight) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawEffects();
  drawScore();
  updateBullets();
  updateEnemies();
  updateEffects();
  detectCollisions();
  requestAnimationFrame(gameLoop);
}

function shoot() {
  const now = Date.now();
  if (now - lastShotTime < shotCooldown) return;
  lastShotTime = now;
  bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 7 });
  currentImg = playerImgHeart;
  setTimeout(() => currentImg = playerImgFront, 200);
}

function spawnEnemy(count = 1) {
  for (let i = 0; i < count; i++) {
    const width = 40;
    const height = 40;
    const type = Math.random() < 0.5 ? 1 : 2;
    enemies.push({
      x: Math.random() * (canvas.width - width),
      y: -height,
      width: width,
      height: height,
      speedY: 2 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 4,
      type: type
    });
  }
}

function startGame() {
  resetGame();
  timerDisplay.textContent = `${gameTime}秒`;
  gameInterval = setInterval(() => {
    gameTime--;
    timerDisplay.textContent = `${gameTime}秒`;
    bonusTime = gameTime <= 10;
    if (gameTime <= 0) {
      clearInterval(gameInterval);
      clearInterval(enemySpawnInterval);
      const title = getTitle(score);
      resultDisplay.innerHTML = `あなたの称号：${title}<br>スコア：${score}<br><button onclick="restartGame()">もう1回！</button>`;
      resultDisplay.style.display = 'block';
    }
  }, 1000);
  enemySpawnInterval = setInterval(() => {
    if (gameTime <= 5) {
      spawnEnemy(6);
    } else if (bonusTime) {
      spawnEnemy(3);
    } else {
      spawnEnemy(1);
    }
  }, 400);
}

function restartGame() {
  document.getElementById('startScreen').style.display = 'flex';
}

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('startScreen').style.display = 'none';
  startGame();
});

gameLoop();

document.getElementById('leftBtn').addEventListener('mousedown', () => { moveLeft = true; currentImg = playerImgLeft; });
document.getElementById('leftBtn').addEventListener('mouseup', () => { moveLeft = false; currentImg = playerImgFront; });
document.getElementById('rightBtn').addEventListener('mousedown', () => { moveRight = true; currentImg = playerImgRight; });
document.getElementById('rightBtn').addEventListener('mouseup', () => { moveRight = false; currentImg = playerImgFront; });
document.getElementById('shootBtn').addEventListener('click', () => shoot());

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { moveLeft = true; currentImg = playerImgLeft; }
  if (e.key === 'ArrowRight') { moveRight = true; currentImg = playerImgRight; }
  if (e.key === ' ' || e.key === 'Enter') shoot();
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') { moveLeft = false; currentImg = playerImgFront; }
  if (e.key === 'ArrowRight') { moveRight = false; currentImg = playerImgFront; }
});
