const earn_every = 10;

async function refresh() {
  const s = await chrome.runtime.sendMessage({ action: "getState" });
  if (!s) return;

  document.getElementById("coinCount").textContent    = s.coins;
  document.getElementById("workMins").textContent     = s.workmins;
  document.getElementById("progressFill").style.width = `${s.progress}%`;
  document.getElementById("nextCoinLabel").textContent = s.nextcoin === 1 ? "1 min" : `${s.nextcoin} mins`;
}

refresh();