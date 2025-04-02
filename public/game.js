// ✅ game.js（完全フルバージョン / スコアとタイマー見やすくピンクに）
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : null;
}

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
bossImg.src = 'boss150.png';
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
const scoreDisplay = document.getElementById('scoreDisplay');
const resultDisplay = document.getElementById('result');

function getTitle(score) {
  if (score >= 150) return '🌈 Legendary Idol Blaster 👑';
  if (score >= 100) return '💥 Dimensional Idol Destroyer';
  if (score >= 90) return '🔥 All-Perfect Hit Master';
  if (score >= 80) return '💫 Supersonic Star Shooter';
  if (score >= 70) return '🚀 Adrenaline Tap Queen';
  if (score >= 60) return '🌟 Cuteness Combo Crusher';
  if (score >= 50) return '👑 Baku-Ad Shooting God';
  if (score >= 40) return '💫 Rapid Fire Fiend';
  if (score >= 30) return '💪 Serious Stage Idol';
  if (score >= 20) return '🌟 Shooting Trainee';
  if (score >= 10) return '🥚 Just Getting Started';
  return '😢 Idol Candidate Under Fire';
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

function drawBossHpBar() {
  if (boss && bossHP > 0) {
    const barWidth = 200;
    const barHeight = 15;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 40;
    const hpRatio = bossHP / 30;
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
}

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
      boss.speedX = Math.random() < 0.5 ? -1.5 : 1.5;
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
      showBossText('Nghh...♡');
      if (bossHP <= 0 && !isGameOver) {
        explosionSound.play();
        score += 40;
        showBossText("I'll admit it... just a little.");
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
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}`;
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
  drawBossHpBar();
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
  timerDisplay.textContent = `${gameTime}s`;
  gameInterval = setInterval(() => {
    if (gameTime <= 0) {
      if (isBossPhase && bossHP > 0) {
        isGameOver = true;
        resultDisplay.innerHTML = `Time's up... Defeat 💀<br><button onclick=\"restartGame()\">Try Again</button>`;
        resultDisplay.style.display = 'block';
        clearInterval(gameInterval);
        clearInterval(enemySpawnInterval);
      }
      return;
    }
    gameTime--;
    timerDisplay.textContent = `${gameTime}s`;
    bonusTime = gameTime <= 10;
    if (!isBossPhase && gameTime <= 0) {
      isBossPhase = true;
      gameTime = 30;
      boss = { x: 50, y: 50, width: 150, height: 150, speedX: 1.5 };
      showBossText('Welcome... to the true live stage!');
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
  resultDisplay.innerHTML = `Your Title: ${title}<br>Score: ${score}<br><button onclick=\"restartGame()\">Play Again</button>`;
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
// ✅ Supabaseスコア送信 & ランキング表示機能つき game.js

// Supabase 設定
const SUPABASE_URL = "https://wkfwfirhoteijgcdsjom.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZndmaXJob3RlaWpnY2Rzam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NjIzOTQsImV4cCI6MjA1OTEzODM5NH0.PinpdOJPb0fGHMfmC5t9kQBJklECELdjhxrSMMwQMRM";

// Farcaster frame から受け取った fid や username を利用する（ここでは仮に固定）
let fid = 123456;
let username = "testuser"; // あとで Frame POSTから動的に受け取る形に変更可能

// スコア送信
async function submitScoreToSupabase(fid, username, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scoreboard`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ fid, username, score })
  });
  const data = await res.json();
  console.log("Score submitted:", data);
}

// ランキング取得（上位10件）
async function fetchRankingFromSupabase() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scoreboard?select=*&order=score.desc&limit=10`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  return await res.json();
}

// ゲーム終了時にランキングも表示
async function endGame() {
  isGameOver = true;
  clearInterval(gameInterval);
  clearInterval(enemySpawnInterval);
  const title = getTitle(score);

  await submitScoreToSupabase(fid, username, score);
  const rankings = await fetchRankingFromSupabase();

  let rankingHTML = '<h3>🏆 Leaderboard</h3><ol>';
  rankings.forEach((r) => {
    rankingHTML += `<li>${r.username || "anon"} - ${r.score}</li>`;
  });
  rankingHTML += '</ol>';

  resultDisplay.innerHTML = `Your Title: ${title}<br>Score: ${score}<br><br>${rankingHTML}<br><button onclick="restartGame()">Play Again</button>`;
  resultDisplay.style.display = 'block';
}

// 既存の game.js に追加する形でOK！
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

const fid = getCookie("fid") || 0;
