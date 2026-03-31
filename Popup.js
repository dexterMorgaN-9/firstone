// popup.js — FirstOne UI logic

const COIN_EARN_INTERVAL = 10;

document.addEventListener("DOMContentLoaded", async () => {
  await refreshUI();
});

async function refreshUI() {
  const state = await chrome.runtime.sendMessage({ action: "getState" });
  if (!state) return;

  const { coins, workMins, nextCoinIn, progressPct } = state;

  document.getElementById("coinCount").textContent = coins;
  document.getElementById("workMins").textContent = workMins;
  document.getElementById("progressFill").style.width = `${progressPct}%`;
  document.getElementById("nextCoinLabel").textContent =
    nextCoinIn === 1 ? "1 min" : `${nextCoinIn} mins`;
}