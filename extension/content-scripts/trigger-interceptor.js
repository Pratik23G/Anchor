// trigger-interceptor.js
// Monitors search form submissions on Google/Bing/DuckDuckGo.
// If the query contains a trigger word, redirects to the interstitial instead.

(function () {
  function containsTriggerWord(text, triggerWords) {
    const lower = text.toLowerCase();
    return triggerWords.some(w => lower.includes(w.toLowerCase()));
  }

  chrome.storage.local.get(["triggerWords"], ({ triggerWords = [] }) => {
    if (!triggerWords.length) return;

    // Intercept form submissions (catches the search box Enter key)
    document.addEventListener("submit", e => {
      const form = e.target;
      const input = form.querySelector('input[name="q"], input[name="p"]');
      if (input && containsTriggerWord(input.value, triggerWords)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = chrome.runtime.getURL("interstitial/blocked.html");
      }
    }, true);

    // Also catch live URL changes if the search uses pushState (Google Instant)
    const params = new URL(location.href).searchParams;
    const q = params.get("q") || params.get("p");
    if (q && containsTriggerWord(q, triggerWords)) {
      window.location.replace(chrome.runtime.getURL("interstitial/blocked.html"));
    }
  });
})();
