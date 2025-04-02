// ✅ IDOL Shooter - 完全復活 game.js（画像・音リンク修正済）

const SUPABASE_URL = "https://wkfwfirhoteijgcdsjom.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZndmaXJob3RlaWpnY2Rzam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NjIzOTQsImV4cCI6MjA1OTEzODM5NH0.PinpdOJPb0fGHMfmC5t9kQBJklECELdjhxrSMMwQMRM";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : null;
}

const fid = getCookie("fid") || 0;
const username = getCookie("username") || "anon";

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

async function fetchRankingFromSupabase() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scoreboard?select=*&order=score.desc&limit=10`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  return await res.json();
}

window.onload = () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const resultDisplay = document.createElement("div");
  document.body.appendChild(resultDisplay);
  resultDisplay.style.display = "none";
  resultDisplay.style.position = "absolute";
  resultDisplay.style.top = "100px";
  resultDisplay.style.left = "50%";
  resultDisplay.style.transform = "translateX(-50%)";
  resultDisplay.style.color = "white";
  resultDisplay.style.fontSize = "20px";
  resultDisplay.style.textAlign = "center";

  const playerFront = new Image(); playerFront.src = "/idol-front.png";
  const playerLeft = new Image(); playerLeft.src = "/idol-left.png";
  const playerRight = new Image(); playerRight.src = "/idol-right.png";
  const playerAttack = new Image(); playerAttack.src = "/idol-heart.png";
  const bulletImg = new Image(); bulletImg.src = "/bullet.png";
  const enemy1Img = new Image(); enemy1Img.src = "/enemy-note.png";
  const enemy2Img = new Image(); enemy2Img.src = "/enemy-note2.png";
  const bossImg = new Image(); bossImg.src = "/boss.png";
  const bgImg = new Image(); bgImg.src = "/stage.png";

  const shootSound = new Audio("/jump-sound.mp3");
  const hitSound = new Audio("/hit-sound.mp3");
  const startSound = new Audio("/start-sound.mp3");
  const boomSound = new Audio("/boom-sound.mp3");

  let player = { x: 210, y: 560, w: 80, h: 80, dir: 0, attacking: false };
  let bullets = [], enemies = [], boss = null;
  let bossHP = 30, bossActive = false;
  let score = 0, timeLeft = 30, isGameOver = false;
  let gameStarted = false;
  let gameInterval, enemySpawnInterval, timerInterval;

  function drawBackground() {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  }

  function drawPlayer() {
    const img = player.attacking ? playerAttack : player.dir === -1 ? playerLeft : player.dir === 1 ? playerRight : playerFront;
    ctx.drawImage(img, player.x, player.y, player.w, player.h);
  }

  function drawBullets() {
    bullets.forEach((b) => ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h));
  }

  function drawEnemies() {
    enemies.forEach((e) => ctx.drawImage(e.type === 2 ? enemy2Img : enemy1Img, e.x, e.y, e.w, e.h));
  }

  function drawBoss() {
    if (boss && bossActive) {
      ctx.drawImage(bossImg, boss.x, boss.y, boss.w, boss.h);
      ctx.fillStyle = "#f00";
      ctx.fillRect(boss.x, boss.y - 10, (bossHP / 30) * boss.w, 5);
    }
  }

  function drawHUD() {
    ctx.fillStyle = "hotpink";
    ctx.font = "18px Arial";
    ctx.fillText("SCORE: " + score, 10, 25);
    ctx.fillText("TIME: " + timeLeft, 370, 25);
  }

  function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    if (player.dir === -1 && player.x > 0) player.x -= 5;
    if (player.dir === 1 && player.x + player.w < canvas.width) player.x += 5;
    bullets.forEach((b) => (b.y -= 8));
    bullets = bullets.filter((b) => b.y > -10);
    enemies.forEach((e) => (e.y += 2));
    enemies = enemies.filter((e) => e.y < canvas.height + 50);
    bullets.forEach((b, bi) => {
      enemies.forEach((e, ei) => {
        if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          bullets.splice(bi, 1);
          enemies.splice(ei, 1);
          score++;
          hitSound.currentTime = 0; hitSound.play();
        }
      });
    });
    if (boss && bossActive) {
      bullets.forEach((b, bi) => {
        if (b.x < boss.x + boss.w && b.x + b.w > boss.x && b.y < boss.y + boss.h && b.y + b.h > boss.y) {
          bullets.splice(bi, 1);
          bossHP--;
          score++;
          hitSound.currentTime = 0; hitSound.play();
          if (bossHP <= 0) {
            score += 50;
            bossActive = false;
            boss = null;
            boomSound.play();
            endGame();
          }
        }
      });
    }
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawBoss();
    drawHUD();
  }

  function spawnEnemy() {
    const x = Math.random() * (canvas.width - 40);
    const type = Math.random() < 0.5 ? 1 : 2;
    enemies.push({ x, y: -40, w: 40, h: 40, type });
  }

  function spawnBoss() {
    boss = { x: 160, y: 50, w: 150, h: 150 };
    bossHP = 30;
    bossActive = true;
    timeLeft = 30;
  }

  async function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(enemySpawnInterval);
    clearInterval(timerInterval);
    await submitScoreToSupabase(fid, username, score);
    const rankings = await fetchRankingFromSupabase();
    let rankingHTML = '<h3>🏆 Leaderboard</h3><ol>';
    rankings.forEach((r) => {
      rankingHTML += `<li>${r.username || "anon"} - ${r.score}</li>`;
    });
    rankingHTML += '</ol>';
    resultDisplay.innerHTML = `Score: ${score}<br><br>${rankingHTML}<br><button onclick=\"location.reload()\">Play Again</button>`;
    resultDisplay.style.display = 'block';
  }

  function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    score = 0; timeLeft = 30; bullets = []; enemies = [];
    boss = null; bossHP = 30; bossActive = false;
    startSound.play();
    gameInterval = setInterval(updateGame, 1000 / 60);
    enemySpawnInterval = setInterval(() => {
      spawnEnemy();
      if (timeLeft <= 10) spawnEnemy();
      if (timeLeft <= 5) spawnEnemy();
    }, 700);
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft === 0 && !bossActive) spawnBoss();
      else if (timeLeft <= 0 && bossActive) endGame();
    }, 1000);
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") player.dir = -1;
    if (e.code === "ArrowRight") player.dir = 1;
    if (e.code === "Space") {
      bullets.push({ x: player.x + player.w / 2 - 10, y: player.y, w: 20, h: 20 });
      player.attacking = true;
      shootSound.currentTime = 0;
      shootSound.play();
      setTimeout(() => (player.attacking = false), 100);
    }
    if (e.code === "Enter") startGame();
  });

  document.addEventListener("keyup", () => {
    player.dir = 0;
  });

  drawBackground();
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Press Enter to Start", 120, 300);
};
