// ✅ game.js（Farcaster対応＆Supabaseスコア送信フル対応）

// 🌐 Supabase 設定
const SUPABASE_URL = "https://wkfwfirhoteijgcdsjom.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZndmaXJob3RlaWpnY2Rzam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NjIzOTQsImV4cCI6MjA1OTEzODM5NH0.PinpdOJPb0fGHMfmC5t9kQBJklECELdjhxrSMMwQMRM";

// 🍪 Cookie取得関数（Farcasterのfidとusername用）
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : null;
}

// 🎮 Farcasterから取得された情報（存在しない場合はデフォルト）
const fid = getCookie("fid") || 0;
const username = getCookie("username") || "anon";

// 💾 スコア送信関数
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

// 🏆 ランキング取得
async function fetchRankingFromSupabase() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scoreboard?select=*&order=score.desc&limit=10`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  return await res.json();
}

// 🎮 ゲーム終了処理でスコア送信＆ランキング表示
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

  resultDisplay.innerHTML = `Your Title: ${title}<br>Score: ${score}<br><br>${rankingHTML}<br><button onclick=\"restartGame()\">Play Again</button>`;
  resultDisplay.style.display = 'block';
}

// 📝 他のゲーム処理（プレイヤー、敵、弾など）はそのまま下に追記！
