const EARN_EVERY = 10;

async function refresh() {
  const state = await chrome.runtime.sendMessage({ action: "getState" });
  if (!state) return;

  const { coins, workMins, nextCoinIn, progressPct } = state;

  document.getElementById("coinCount").textContent        = coins;
  document.getElementById("workMins").textContent         = workMins;
  document.getElementById("progressFill").style.width     = `${progressPct}%`;
  document.getElementById("nextCoinLabel").textContent    = nextCoinIn === 1 ? "1 min" : `${nextCoinIn} mins`;
}

document.addEventListener("DOMContentLoaded", refresh);