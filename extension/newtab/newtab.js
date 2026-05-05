// newtab.js

(function () {
  const content = window.ANCHOR_CONTENT || { quotes: [], journalPrompts: [] };

  // ── Date & streaks ────────────────────────────────────────────────────

  function formatDate(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  document.getElementById("dateDisplay").textContent = formatDate(new Date());

  chrome.storage.local.get(["streaks"], ({ streaks = {} }) => {
    const aligned = streaks.alignedDays || 0;
    const learning = streaks.learningDays || 0;
    document.getElementById("streaksDisplay").textContent =
      `${aligned} aligned · ${learning} learning`;
  });

  // ── Daily quote ───────────────────────────────────────────────────────

  const quotes = content.quotes;
  const dayIdx = Math.floor(Date.now() / 86400000) % quotes.length;
  const quote = quotes[dayIdx];

  if (quote) {
    document.getElementById("quoteText").textContent = quote.text;
    document.getElementById("quoteSource").textContent = "— " + quote.source;
  }

  // ── Journal prompt ────────────────────────────────────────────────────

  const prompts = content.journalPrompts || [];
  if (prompts.length) {
    const pIdx = Math.floor(Date.now() / 86400000) % prompts.length;
    document.getElementById("journalPrompt").textContent = prompts[pIdx];
  }

  // ── Today's learning plan ─────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);

  chrome.storage.local.get(["learningPlan"], ({ learningPlan = {} }) => {
    const plan = learningPlan[today];
    const emptyEl = document.getElementById("learningEmpty");
    const contentEl = document.getElementById("learningContent");

    if (!plan || !plan.topic) {
      emptyEl.style.display = "";
      contentEl.setAttribute("hidden", "");
      return;
    }

    emptyEl.style.display = "none";
    contentEl.removeAttribute("hidden");

    document.getElementById("learningTopic").textContent = plan.topic;

    const ul = document.getElementById("learningResources");
    (plan.resources || []).forEach(r => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = r.url;
      a.textContent = r.title;
      a.target = "_blank";
      a.rel = "noopener";
      li.appendChild(a);
      ul.appendChild(li);
    });

    const checkbox = document.getElementById("learningDone");
    checkbox.checked = !!plan.completed;

    checkbox.addEventListener("change", () => {
      chrome.runtime.sendMessage({ type: "MARK_LEARNING_DONE", date: today });
    });
  });

  // ── Settings button ───────────────────────────────────────────────────

  document.getElementById("settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("openOptions")?.addEventListener("click", e => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();
