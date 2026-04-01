const BLOCKED =[
  "instagram.com","twicth.tv","facebook.com","twitter.com","netflix.com","hulu.com","reddit.com",
    "tiktok.com", "discord.com","store.steampowered.com", "steamcommunity.com",
  "pinterest.com",
];

const EARN_EVRY = 10;
const Earn_AMT = 15;
const UNLOCK_MINS = 10;

let tab_id = null;
let ticker = null;
let mem_sec = 0;
let mem_coins = 0;

function midnight() {
  const d= new Date();
  d.setHours(24,0,0,0);
  return d.getTime();
}

function domainof(url) {
  try { return (new URL(url).hostname.replace("www.",
    "");} 
    catch { return ""; }
  }

  async function site_check(domain) {
    const blocked = BLOCKED.some(s => domain.includes(s));
    if (!blocked) return {blocked: false};

    const data   = await
    chrome.storage.local.get("unblockedSites");
    const unblocked = data.unblockedSites || [];

    if (unblocked[domain] && unblocked[domain] > Date.now() 
      