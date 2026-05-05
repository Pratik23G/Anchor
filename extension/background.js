// Anchor — background service worker
// Manages declarativeNetRequest blocking rules and storage initialization.

importScripts("shared/content.js");

const BLOCKED_PAGE = chrome.runtime.getURL("interstitial/blocked.html");
const RULE_ID_BASE = 1000;

// ── Initialization ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(["blocklist", "triggerWords", "initialized"]);
  if (!existing.initialized) {
    await chrome.storage.local.set({
      blocklist: ANCHOR_CONTENT.blocklist,
      triggerWords: ANCHOR_CONTENT.triggerWords,
      learningPlan: {},
      streaks: { alignedDays: 0, learningDays: 0, lastAlignedDate: null, lastLearningDate: null },
      initialized: true
    });
  }
  await syncBlockRules();
});

// ── Block rule management ─────────────────────────────────────────────────

async function syncBlockRules() {
  const { blocklist = [] } = await chrome.storage.local.get("blocklist");

  // Remove all existing dynamic rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  const newRules = blocklist.map((domain, i) => ({
    id: RULE_ID_BASE + i,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/interstitial/blocked.html" }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"]
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: newRules
  });
}

// ── Message handling (from options page) ─────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "UPDATE_BLOCKLIST") {
    chrome.storage.local.set({ blocklist: msg.blocklist }, async () => {
      await syncBlockRules();
      sendResponse({ ok: true });
    });
    return true; // async response
  }

  if (msg.type === "GET_TODAY_DATA") {
    getTodayData().then(data => sendResponse(data));
    return true;
  }

  if (msg.type === "MARK_LEARNING_DONE") {
    markLearningDone(msg.date).then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Daily data helpers ────────────────────────────────────────────────────

async function getTodayData() {
  const today = todayKey();
  const { learningPlan = {}, streaks = {} } = await chrome.storage.local.get(["learningPlan", "streaks"]);
  const quotes = ANCHOR_CONTENT.quotes;
  const dailyIdx = Math.floor(Date.now() / 86400000) % quotes.length;
  const quote = quotes[dailyIdx];
  const todayPlan = learningPlan[today] || null;

  return { quote, todayPlan, streaks, date: today };
}

async function markLearningDone(date) {
  const { learningPlan = {}, streaks = {} } = await chrome.storage.local.get(["learningPlan", "streaks"]);
  if (learningPlan[date]) {
    learningPlan[date].completed = true;
  }
  const today = todayKey();
  if (date === today && streaks.lastLearningDate !== today) {
    streaks.learningDays = (streaks.learningDays || 0) + 1;
    streaks.lastLearningDate = today;
  }
  await chrome.storage.local.set({ learningPlan, streaks });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
