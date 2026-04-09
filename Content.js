(async () => {
  const dmn = window.location.hostname.replace("www.", "");
  const res = await chrome.runtime.sendMessage({ action: "checkSite", domain: dmn }).catch(() => null);
  if (res && res.blocked) overlay(res.coins, res.cost, dmn);
})();

function overlay(coins, cost, dmn) {
  document.documentElement.style.overflow = "hidden";
  chrome.runtime.sendMessage({ action: "pauseTimer" });

  const sitename = dmn.split(".")[0];
  const label    = sitename.charAt(0).toUpperCase() + sitename.slice(1);
  const canbuy   = coins >= cost;

  const el = document.createElement("div");
  el.id = "fo-overlay";

  el.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
      #fo-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: #1a0f08;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Nunito', sans-serif;
      }
      .fo-card {
        background: rgba(42, 24, 16, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(143, 102, 64, 0.4);
        border-radius: 24px;
        padding: 36px 40px;
        max-width: 380px;
        width: 90%;
        text-align: center;
        box-shadow: 0 8px 40px rgba(143, 102, 64, 0.3), 0 0 80px rgba(143, 102, 64, 0.1);
      }
      .fo-lock {
        font-size: 48px;
        margin-bottom: 10px;
        display: block;
        animation: fo-float 3s ease-in-out infinite;
      }
      @keyframes fo-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .fo-title {
        font-size: 22px;
        font-weight: 800;
        color: #8f6640;
        margin-bottom: 4px;
      }
      .fo-sub {
        font-size: 13px;
        color: #b8865a;
        font-weight: 500;
        margin-bottom: 24px;
        opacity: 0.9;
      }
      .fo-coins-box {
        background: #3d2618;
        border: 1px solid rgba(143, 102, 64, 0.35);
        border-radius: 14px;
        padding: 14px 20px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .fo-coins-label { font-size: 12px; color: #b8865a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .fo-coins-val   { font-size: 24px; font-weight: 800; color: #ffffff; }
      .fo-cost        { font-size: 13px; color: #e8d5c0; font-weight: 500; margin-bottom: 20px; }
      .fo-cost strong { font-weight: 800; color: #8f6640; }
      .fo-btn {
        width: 100%;
        padding: 13px;
        border-radius: 14px;
        border: none;
        font-family: 'Nunito', sans-serif;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 10px;
      }
      .fo-btn-primary {
        background: linear-gradient(135deg, #8f6640, #6b4d30);
        color: white;
        box-shadow: 0 4px 16px rgba(143, 102, 64, 0.4);
      }
      .fo-btn-primary:hover    { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(143, 102, 64, 0.55); }
      .fo-btn-primary:disabled { background: linear-gradient(135deg, #4d3020, #3d2618); color: #6b4d30; box-shadow: none; cursor: not-allowed; transform: none; }
      .fo-btn-secondary        { background: transparent; color: #b8865a; border: 1px solid rgba(143, 102, 64, 0.35); }
      .fo-btn-secondary:hover  { background: rgba(143, 102, 64, 0.15); }
      .fo-hint    { font-size: 11px; color: #e8d5c0; margin-top: 4px; font-weight: 500; opacity: 0.7; }
      .fo-warning {
        background: rgba(251,191,36,0.12);
        border: 1px solid rgba(251,191,36,0.4);
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 12px;
        color: #fbbf24;
        font-weight: 700;
        margin-bottom: 14px;
        display: none;
      }
    </style>

    <div class="fo-card">
      <span class="fo-lock">🔐</span>
      <div class="fo-title">${label} is locked</div>
      <div class="fo-sub">work to earn coins, spend them to unlock</div>

      <div class="fo-coins-box">
        <span class="fo-coins-label">🪙 YOUR COINS</span>
        <span class="fo-coins-val">${coins}</span>
      </div>

      <div class="fo-cost">unlock 10 mins = <strong>${cost} coins</strong></div>

      <div class="fo-warning" id="fo-warn">⚠️ 1 minute left — wrap it up!</div>

      <button class="fo-btn fo-btn-primary" id="fo-unlock" ${canbuy ? "" : "disabled"}>
        ${canbuy ? `🪙 spend ${cost} coins & unlock` : `need ${cost - coins} more coins`}
      </button>
      <button class="fo-btn fo-btn-secondary" id="fo-back">← go back & keep earning</button>

      ${!canbuy ? `<div class="fo-hint">15 coins every 10 mins of work ✨</div>` : ""}
    </div>
  `;

  document.documentElement.appendChild(el);

  document.getElementById("fo-unlock")?.addEventListener("click", async () => {
    const res = await chrome.runtime.sendMessage({ action: "spendCoins", domain: dmn });
    if (res && res.success) {
      chrome.runtime.sendMessage({ action: "resumeTimer" });
      setTimeout(() => {
        const warn = document.getElementById("fo-warn");
        if (warn) warn.style.display = "block";
      }, 9 * 60 * 1000);
      el.remove();
      document.documentElement.style.overflow = "";
      location.reload();
    }
  });

  document.getElementById("fo-back")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "resumeTimer" });
    window.history.back();
  });
}
