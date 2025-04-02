// game.js（最新版）
// 修正内容：
// ・ボス画像を200x200に変更（ファイル名 boss200.png）
// ・ゲーム終了後（タイマー0）に攻撃・撃破不可
// ・isGameOver フラグ追加で制御

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
const bossImg = new Image();
const bulletImg = new Image();

enemyImg1.src = 'note-cute1.png';
enemyImg2.src = 'note-cute2.png';
bossImg.src = 'boss200.png';
bulletImg.src = 'bullet.png';

const shootSound = new Audio('cute_shoot.mp3');
const hitSound = new Audio('poan_hit.mp3');
const startSound = new Audio('start_jingle.mp3');
const explosionSound = new Audio('fancy_bakuad.mp3');

let currentImg = playerImgFront;
const player = { x: 180, y: 500, width: 60, height: 60, speed: 5 };
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

let isBossPhase = false;
let boss = null;
let bossHP = 30;
let bossMoveTimer = 0;
let isGameOver = false;

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
  boss = null;
  bossHP = 30;
  isBossPhase = false;
  isGameOver = false;
  currentImg = playerImgFront;
  resultDisplay.innerHTML = '';
  resultDisplay.style.display = 'none';
  document.getElementById('bossText')?.remove();
}

function drawPlayer() { ctx.drawImage(currentImg, player.x, player.y, player.width, player.height); }
function drawBullets() { bullets.forEach((b) => { ctx.drawImage(bulletImg, b.x - 10, b.y - 10, 20, 20); }); }
function drawEnemies() { enemies.forEach((e) => { const img = e.type === 1 ? enemyImg1 : enemyImg2; ctx.drawImage(img, e.x, e.y, e.width, e.height); }); }
function drawBoss() { if (boss) ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height); }
function drawEffects() { effects.forEach((fx, i) => { ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.size, 0, Math.PI * 2); ctx.fillStyle = fx.color || `rgba(255,192,203,${fx.alpha})`; ctx.fill(); }); }

function updateBullets() {
  bullets.forEach((b, i) => { b.y -= b.speed; if (b.y < 0) bullets.splice(i, 1); });
}

function updateEnemies() {
  enemies.forEach((e, i) => {
    e.y += e.speedY;
    e.x += e.speedX;
    if (e.x < 0 || e.x > canvas.width - e.width) e.speedX *= -1;
    if (e.y > canvas.height) enemies.splice(i, 1);
  });
}

function updateBoss() {
  if (boss) {
    boss.x += boss.speedX;
    if (boss.x < 0 || boss.x > canvas.width - boss.width) boss.speedX *= -1;
    bossMoveTimer++;
    if (bossMoveTimer % 30 === 0) {
      boss.speedX = Math.random() < 0.5 ? -2 : 2;
    }
  }
}

function updateEffects() {
  effects.forEach((fx, i) => {
    fx.alpha -= 0.05;
    fx.size += 1;
    if (fx.alpha <= 0) effects.splice(i, 1);
  });
}

function showBossText(text) {
  const textEl = document.createElement('div');
  textEl.id = 'bossText';
  textEl.textContent = text;
  textEl.style.position = 'absolute';
  textEl.style.top = '50%';
  textEl.style.left = '50%';
  textEl.style.transform = 'translate(-50%, -50%)';
  textEl.style.fontSize = '24px';
  textEl.style.fontWeight = 'bold';
  textEl.style.background = 'rgba(0,0,0,0.6)';
  textEl.style.color = '#fff';
  textEl.style.padding = '10px';
  textEl.style.borderRadius = '12px';
  textEl.style.zIndex = '10';
  document.body.appendChild(textEl);
  setTimeout(() => textEl.remove(), 1200);
}

function detectCollisions() {
  if (isGameOver) return;
  bullets.forEach((b, bIndex) => {
    if (boss && b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
      bullets.splice(bIndex, 1);
      effects.push({ x: b.x, y: b.y, size: 20, alpha: 1.2, color: 'rgba(255,0,200,0.8)' });
      bossHP--;
      showBossText('くっ…♡');
      if (bossHP <= 0 && !isGameOver) {
        explosionSound.play();
        score += 40;
        showBossText('認めてあげる…ちょっとだけね');
        boss = null;
        endGame();
      }
      return;
    }
    enemies.forEach((e, eIndex) => {
      if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
        effects.push({ x: b.x, y: b.y, size: 5, alpha: 1 });
        hitSound.currentTime = 0;
        hitSound.play();
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
  if (!isGameOver) {
    if (moveLeft) player.x = Math.max(0, player.x - player.speed);
    if (moveRight) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
  }
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawBoss();
  drawEffects();
  drawScore();
  updateBullets();
  updateEnemies();
  updateEffects();
  updateBoss();
  detectCollisions();
  requestAnimationFrame(gameLoop);
}

function shoot() {
  if (isGameOver) return;
  const now = Date.now();
  if (now - lastShotTime < shotCooldown) return;
  lastShotTime = now;
  bullets.push({ x: player.x + player.width / 2, y: player.y, speed: 7 });
  shootSound.currentTime = 0;
  shootSound.play();
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
  startSound.play();
  timerDisplay.textContent = `${gameTime}秒`;
  gameInterval = setInterval(() => {
    if (gameTime <= 0) {
      if (isBossPhase && bossHP > 0) {
        isGameOver = true;
        resultDisplay.innerHTML = `時間切れ…敗北です💀<br><button onclick=\"restartGame()\">リベンジ！</button>`;
        resultDisplay.style.display = 'block';
        clearInterval(gameInterval);
        clearInterval(enemySpawnInterval);
      }
      return;
    }

    gameTime--;
    timerDisplay.textContent = `${gameTime}秒`;
    bonusTime = gameTime <= 10;

    if (!isBossPhase && gameTime <= 0) {
      isBossPhase = true;
      gameTime = 30;
      boss = {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        speedX: 2
      };
      showBossText('ようこそ…本当のライブへ');
    }
  }, 1000);

  enemySpawnInterval = setInterval(() => {
    if (!isBossPhase) {
      if (gameTime <= 5) {
        spawnEnemy(6);
      } else if (bonusTime) {
        spawnEnemy(3);
      } else {
        spawnEnemy(1);
      }
    }
  }, 400);
}

function endGame() {
  isGameOver = true;
  clearInterval(gameInterval);
  clearInterval(enemySpawnInterval);
  const title = getTitle(score);
  resultDisplay.innerHTML = `あなたの称号：${title}<br>スコア：${score}<br><button onclick=\"restartGame()\">もう1回！</button>`;
  resultDisplay.style.display = 'block';
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
