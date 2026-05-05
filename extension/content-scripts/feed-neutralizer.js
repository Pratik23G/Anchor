// feed-neutralizer.js
// Hides algorithmic feeds; injects a replacement Anchor panel.

(function () {
  const host = location.hostname;

  function getSiteClass() {
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("twitter.com"))   return "twitter";
    if (host.includes("x.com"))         return "xdotcom";
    if (host.includes("youtube.com"))   return "youtube";
    if (host.includes("reddit.com"))    return "reddit";
    if (host.includes("facebook.com"))  return "facebook";
    if (host.includes("tiktok.com"))    return "tiktok";
    return null;
  }

  const siteClass = getSiteClass();
  if (!siteClass) return;

  // ── Mark body so CSS rules activate ──────────────────────────────────

  document.body.classList.add("anchor-neutralized", siteClass);

  // ── Build the replacement panel ───────────────────────────────────────

  function buildPanel() {
    const content = window.ANCHOR_CONTENT || { quotes: [], journalPrompts: [] };
    const quotes = content.quotes || [];
    const dayIdx = Math.floor(Date.now() / 86400000) % (quotes.length || 1);
    const quote = quotes[dayIdx] || null;

    const panel = document.createElement("div");
    panel.className = "anchor-panel";
    panel.id = "anchor-panel";

    if (quote) {
      const q = document.createElement("p");
      q.className = "anchor-panel__quote";
      q.textContent = "“" + quote.text + "”";
      const s = document.createElement("p");
      s.className = "anchor-panel__source";
      s.textContent = "— " + quote.source;
      panel.appendChild(q);
      panel.appendChild(s);
    }

    const div = document.createElement("div");
    div.className = "anchor-panel__divider";
    panel.appendChild(div);

    const pLabel = document.createElement("p");
    pLabel.className = "anchor-panel__task-label";
    pLabel.textContent = "today's learning";
    panel.appendChild(pLabel);

    const pTask = document.createElement("p");
    pTask.className = "anchor-panel__task";
    pTask.id = "anchor-panel-task";
    pTask.textContent = "—";
    panel.appendChild(pTask);

    const pPrompt = document.createElement("p");
    pPrompt.className = "anchor-panel__prompt";
    pPrompt.textContent = "Why am I here?";
    panel.appendChild(pPrompt);

    chrome.storage.local.get(["learningPlan"], ({ learningPlan = {} }) => {
      const today = new Date().toISOString().slice(0, 10);
      const plan = learningPlan[today];
      if (plan && plan.topic) {
        document.getElementById("anchor-panel-task").textContent = plan.topic;
      }
    });

    return panel;
  }

  // ── Inject panel into the page ────────────────────────────────────────

  function injectPanel(target) {
    if (document.getElementById("anchor-panel")) return;
    const panel = buildPanel();
    target.parentNode.insertBefore(panel, target);
  }

  // ── Site-specific feed target selectors ──────────────────────────────

  const feedSelectors = {
    instagram: 'main[role="main"]',
    twitter:   '[data-testid="primaryColumn"]',
    xdotcom:   '[data-testid="primaryColumn"]',
    youtube:   "ytd-browse, ytd-page-manager",
    reddit:    ".ListingLayout-outerContainer, shreddit-feed, #AppRouter-main-content",
    facebook:  '[role="main"]',
    tiktok:    "main"
  };

  const selector = feedSelectors[siteClass];
  if (!selector) return;

  // Use MutationObserver because SPAs render content after initial page load
  let injected = false;

  function tryInject() {
    if (injected) return;
    const el = document.querySelector(selector);
    if (el) {
      injectPanel(el);
      injected = true;
    }
  }

  tryInject();

  const observer = new MutationObserver(() => {
    tryInject();
    // Re-add the CSS class in case SPA navigation removed it
    document.body.classList.add("anchor-neutralized", siteClass);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Disconnect after panel is injected to avoid performance overhead
  const checkInterval = setInterval(() => {
    if (injected) {
      observer.disconnect();
      clearInterval(checkInterval);
    }
  }, 2000);

  // Handle SPA navigation (pushState / popState)
  const origPushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    origPushState(...args);
    // Re-run on navigation; reset so panel can re-inject on new feed pages
    setTimeout(() => {
      injected = false;
      document.getElementById("anchor-panel")?.remove();
      document.body.classList.add("anchor-neutralized", siteClass);
      tryInject();
    }, 500);
  };

  window.addEventListener("popstate", () => {
    setTimeout(() => {
      injected = false;
      document.getElementById("anchor-panel")?.remove();
      document.body.classList.add("anchor-neutralized", siteClass);
      tryInject();
    }, 500);
  });
})();
