// game.js（当たり判定ゆるめ + 弾・敵・ボス + HP管理 + ダメージ演出の完全版）

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 360;
canvas.height = 640;

let bgReady = false;
const bgImage = new Image();
bgImage.src = "stage.png";
bgImage.onload = () => {
  bgReady = true;
};

const startSound = new Audio("start_jingle.mp3");
const shootSound = new Audio("cute_shoot.mp3");
const hitSound = new Audio("poan_hit.mp3");
const boomSound = new Audio("public_boom-sound.mp3");
const victorySound = new Audio("fancy_bakuad.mp3");

const playerImages = {
  front: new Image(),
  left: new Image(),
  right: new Image(),
  shoot: new Image(),
};
playerImages.front.src = "front.png";
playerImages.left.src = "left.png";
playerImages.right.src = "right.png";
playerImages.shoot.src = "heart.png";

const enemyImages = [new Image(), new Image()];
enemyImages[0].src = "note-cute1.png";
enemyImages[1].src = "note-cute2.png";

const bulletImage = new Image();
bulletImage.src = "bullet.png";

const bossImage = new Image();
bossImage.src = "boss150.png";

const player = {
  x: 150,
  y: 540,
  width: 60,
  height: 60,
  speed: 5,
  image: playerImages.front,
};

let bullets = [];
let enemies = [];
let effects = [];
let score = 0;
let moveLeft = false;
let moveRight = false;
let lastShot = 0;
let timeLeft = 30;
let timerInterval;
let spawnInterval;
let boss = null;
let bossActive = false;
let bossLine = "";
let bossLineTimer = 0;
let damageFlashTimer = 0;

const cooldown = 250;
let playerHealth = 5;
const maxPlayerHealth = 5;

const timerDisplay = document.getElementById("timerDisplay");
const scoreDisplay = document.getElementById("scoreValue");
const resultDisplay = document.getElementById("result");
const playerHealthBar = document.getElementById("playerHealth");

function updatePlayerHealthBar() {
  const percent = (playerHealth / maxPlayerHealth) * 100;
  playerHealthBar.style.width = `${percent}%`;
}

function drawBackground() {
  if (bgReady) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (damageFlashTimer > 0) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    damageFlashTimer--;
  }
}

function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function drawBullets() {
  bullets.forEach(b => ctx.drawImage(bulletImage, b.x - 10, b.y - 10, 20, 20));
}

function drawEnemies() {
  enemies.forEach(e => ctx.drawImage(enemyImages[e.type], e.x, e.y, e.width, e.height));
}

function drawBoss() {
  if (boss) {
    ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
    const hpBarWidth = 150;
    const hpBarHeight = 10;
    const hpPercent = boss.hp / 30;
    ctx.fillStyle = "#000";
    ctx.fillRect(boss.x, boss.y - 15, hpBarWidth, hpBarHeight);
    ctx.fillStyle = "#f00";
    ctx.fillRect(boss.x, boss.y - 15, hpBarWidth * hpPercent, hpBarHeight);
    if (bossLineTimer > 0 && bossLine) {
      ctx.fillStyle = "#000";
      ctx.font = "16px sans-serif";
      ctx.fillText(bossLine, boss.x, boss.y - 25);
    }
  }
}

function drawEffects() {
  effects.forEach(fx => {
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,192,203,${fx.alpha})`;
    ctx.fill();
  });
}

function drawScore() {
  scoreDisplay.textContent = score;
}

function updateBullets() {
  bullets = bullets.filter(b => (b.y -= b.speed) > 0);
}

function updateEnemies() {
  enemies = enemies.filter(e => {
    e.y += e.speedY;
    e.x += e.speedX;
    if (e.x <= 0 || e.x >= canvas.width - e.width) e.speedX *= -1;
    return e.y <= canvas.height;
  });
}

function updateBoss() {
  if (!boss) return;
  boss.x += boss.speedX;
  if (boss.x < 0 || boss.x > canvas.width - boss.width) boss.speedX *= -1;
  if (bossLineTimer > 0) bossLineTimer--;
}

function updateEffects() {
  effects = effects.filter(fx => {
    fx.alpha -= 0.05;
    fx.size += 1;
    return fx.alpha > 0;
  });
}

function detectCollisions() {
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        effects.push({ x: b.x, y: b.y, size: 5, alpha: 1 });
        hitSound.currentTime = 0;
        hitSound.play();
        score++;
      }
    });
  });

  bullets.forEach((b, bi) => {
    if (
      boss &&
      b.x > boss.x &&
      b.x < boss.x + boss.width &&
      b.y > boss.y &&
      b.y < boss.y + boss.height
    ) {
      bullets.splice(bi, 1);
      effects.push({ x: b.x, y: b.y, size: 5, alpha: 1 });
      hitSound.currentTime = 0;
      hitSound.play();
      boss.hp--;
      bossLine = bossHitLines[Math.floor(Math.random() * bossHitLines.length)];
      bossLineTimer = 60;
      if (boss.hp <= 0) {
        boomSound.play();
        bossLine = bossDefeatedLine;
        bossLineTimer = 180;
        score += 40;
        setTimeout(() => {
          boss = null;
          bossActive = false;
          endGame();
        }, 1000);
      }
    }
  });

  const buffer = 10;
  enemies.forEach((e, ei) => {
    if (
      player.x + buffer < e.x + e.width &&
      player.x + player.width - buffer > e.x &&
      player.y + buffer < e.y + e.height &&
      player.y + player.height - buffer > e.y
    ) {
      enemies.splice(ei, 1);
      playerHealth--;
      updatePlayerHealthBar();
      damageFlashTimer = 10;
      if (playerHealth <= 0) {
        clearInterval(timerInterval);
        clearInterval(spawnInterval);
        resultDisplay.innerHTML = `<div style='color: #000;'>Game Over!<br>You were overwhelmed...<br>Score: ${score}<br><button onclick=\"restartGame()\">Try Again</button>`;
        resultDisplay.style.display = "block";
        document.getElementById("gameUI").style.display = "none";
      }
    }
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < cooldown) return;
  lastShot = now;
  bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 7 });
  player.image = playerImages.shoot;
  shootSound.currentTime = 0;
  shootSound.play();
  setTimeout(() => (player.image = playerImages.front), 200);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (moveLeft) player.x = Math.max(0, player.x - player.speed);
  if (moveRight) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawBoss();
  drawEffects();
  drawScore();
  updateBullets();
  updateEnemies();
  updateBoss();
  updateEffects();
  detectCollisions();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  bullets = [];
  enemies = [];
  effects = [];
  score = 0;
  moveLeft = false;
  moveRight = false;
  lastShot = 0;
  timeLeft = 30;
  player.image = playerImages.front;
  resultDisplay.innerHTML = "";
  resultDisplay.style.display = "none";
  document.getElementById("gameUI").style.display = "block";
  boss = null;
  bossActive = false;
  bossLine = "";
  bossLineTimer = 0;
  playerHealth = maxPlayerHealth;
  updatePlayerHealthBar();
  damageFlashTimer = 0;
}

function startGame() {
  timerDisplay.textContent = `${timeLeft}s`;
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerDisplay.textContent = `${timeLeft}s`;
    }
  }, 1000);
  spawnInterval = setInterval(() => {
    if (timeLeft <= 5) spawnEnemy(6);
    else if (timeLeft <= 10) spawnEnemy(3);
    else spawnEnemy(1);
  }, 400);
}

function spawnEnemy(count = 1) {
  for (let i = 0; i < count; i++) {
    const width = 40;
    const height = 40;
    const type = Math.floor(Math.random() * 2);
    enemies.push({
      x: Math.random() * (canvas.width - width),
      y: -height,
      width,
      height,
      speedY: 2 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 4,
      type,
    });
  }
}

function restartGame() {
  document.getElementById("startScreen").style.display = "flex";
  document.getElementById("result").style.display = "none";
  document.getElementById("gameUI").style.display = "none";
}

document.getElementById("startButton").addEventListener("click", () => {
  if (!bgReady) {
    alert("Background is still loading... Please wait a moment!");
    return;
  }
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameUI").style.display = "block";
  resetGame();
  startGame();
  gameLoop();
});

document.getElementById("leftBtn").addEventListener("mousedown", () => {
  moveLeft = true;
  player.image = playerImages.left;
});
document.getElementById("leftBtn").addEventListener("mouseup", () => {
  moveLeft = false;
  player.image = playerImages.front;
});

document.getElementById("rightBtn").addEventListener("mousedown", () => {
  moveRight = true;
  player.image = playerImages.right;
});
document.getElementById("rightBtn").addEventListener("mouseup", () => {
  moveRight = false;
  player.image = playerImages.front;
});

document.getElementById("shootBtn").addEventListener("click", shoot);

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") {
    moveLeft = true;
    player.image = playerImages.left;
  }
  if (e.key === "ArrowRight") {
    moveRight = true;
    player.image = playerImages.right;
  }
  if (e.key === " " || e.key === "Enter") shoot();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") {
    moveLeft = false;
    player.image = playerImages.front;
  }
  if (e.key === "ArrowRight") {
    moveRight = false;
    player.image = playerImages.front;
  }
});
