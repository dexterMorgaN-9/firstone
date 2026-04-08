const blocked = [
  "instagram.com",
  "twitch.tv",
  "tiktok.com",
  "discord.com",
  "store.steampowered.com",
  "steamcommunity.com",
  "pinterest.com",
  "facebook.com",
  "reddit.com"
];

const earn_every = 10;
const earn_amt   = 15;
const spend_amt  = 20;
const unlock_dur = 10;

function domain(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return ""; }
}

function next_midnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

async function state() {
  const d = await chrome.storage.local.get(["coins", "worksecs", "unlocked"]);
  const coins   = d.coins    || 0;
  const worksecs = d.worksecs || 0;
  const workmins = Math.floor(worksecs / 60);
  const intv_pos = workmins % earn_every;
  return {
    coins,
    workmins,
    nextcoin:   earn_every - intv_pos,
    progress:   Math.round((intv_pos / earn_every) * 100),
    unlocked:   d.unlocked || {}
  };
}

async function check(dmn) {
  const is_blocked = blocked.some(s => dmn.includes(s));
  if (!is_blocked) return { blocked: false };

  const d = await chrome.storage.local.get(["unlocked", "coins"]);
  const unlocked = d.unlocked || {};

  if (unlocked[dmn] && unlocked[dmn] > Date.now()) {
    const minsleft = Math.ceil((unlocked[dmn] - Date.now()) / 60000);
    return { blocked: false, unlocked: true, minsleft };
  }

  return { blocked: true, coins: d.coins || 0, cost: spend_amt };
}

async function spend(dmn) {
  const d = await chrome.storage.local.get(["coins", "unlocked"]);
  let coins    = d.coins    || 0;
  const unlocked = d.unlocked || {};

  if (coins < spend_amt) return { success: false, reason: "not_enough" };

  coins -= spend_amt;
  unlocked[dmn] = Date.now() + unlock_dur * 60 * 1000;
  await chrome.storage.local.set({ coins, unlocked });

  chrome.alarms.create(`reblock_${dmn}`, { delayInMinutes: unlock_dur });

  return { success: true, coins, minsleft: unlock_dur };
}

let activetab  = null;
let ticker     = null;
let paused     = false;

async function track(url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return;
  const dmn = domain(url);
  if (blocked.some(s => dmn.includes(s))) return;

  ticker = setInterval(async () => {
    if (paused) return;

    const d = await chrome.storage.local.get(["worksecs", "coins"]);
    let secs  = (d.worksecs || 0) + 1;
    let coins = d.coins || 0;

    if (secs % (earn_every * 60) === 0) {
      coins += earn_amt;
      chrome.action.setBadgeText({ text: `${coins}` });
      chrome.action.setBadgeBackgroundColor({ color: "#c4663a" });
    }

    await chrome.storage.local.set({ worksecs: secs, coins });
  }, 1000);
}

chrome.runtime.onInstalled.addListener(async () => {
  const d = await chrome.storage.local.get(["coins", "worksecs", "unlocked", "installdate"]);
  if (!d.coins)       await chrome.storage.local.set({ coins: 0 });
  if (!d.worksecs)    await chrome.storage.local.set({ worksecs: 0 });
  if (!d.unlocked)    await chrome.storage.local.set({ unlocked: {} });
  if (!d.installdate) await chrome.storage.local.set({ installdate: Date.now() });
});

chrome.alarms.create("dailyreset", { when: next_midnight(), periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyreset") {
    await chrome.storage.local.set({ coins: 0, worksecs: 0, unlocked: {} });
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  if (alarm.name.startsWith("reblock_")) {
    const dmn = alarm.name.replace("reblock_", "");
    const d = await chrome.storage.local.get("unlocked");
    const unlocked = d.unlocked || {};
    delete unlocked[dmn];
    await chrome.storage.local.set({ unlocked });

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && domain(tab.url).includes(dmn)) chrome.tabs.reload(tab.id);
    }
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  clearInterval(ticker);
  activetab = tabId;
  paused = false;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab && tab.url) track(tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (tabId === activetab && info.status === "complete" && tab.url) {
    clearInterval(ticker);
    paused = false;
    track(tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activetab) clearInterval(ticker);
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.action === "checkSite")   { check(msg.domain).then(reply);  return true; }
  if (msg.action === "spendCoins")  { spend(msg.domain).then(reply);  return true; }
  if (msg.action === "getState")    { state().then(reply);             return true; }
  if (msg.action === "pauseTimer")  { paused = true;  reply({ ok: true }); return true; }
  if (msg.action === "resumeTimer") { paused = false; reply({ ok: true }); return true; }
});