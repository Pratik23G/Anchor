// options.js

(function () {
  // ── Tabs ──────────────────────────────────────────────────────────────

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.setAttribute("hidden", ""));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).removeAttribute("hidden");
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────

  function flash(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.removeAttribute("hidden");
    setTimeout(() => el.setAttribute("hidden", ""), 2500);
  }

  // ── Learning tab ──────────────────────────────────────────────────────

  const planDateEl = document.getElementById("planDate");
  const planTopicEl = document.getElementById("planTopic");
  const titleInputs = document.querySelectorAll(".resource-title");
  const urlInputs   = document.querySelectorAll(".resource-url");

  const todayISO = new Date().toISOString().slice(0, 10);
  planDateEl.value = todayISO;

  function loadLearningForDate(date) {
    chrome.storage.local.get(["learningPlan"], ({ learningPlan = {} }) => {
      const plan = learningPlan[date] || {};
      planTopicEl.value = plan.topic || "";
      const resources = plan.resources || [];
      titleInputs.forEach((t, i) => { t.value = (resources[i] || {}).title || ""; });
      urlInputs.forEach((u, i) => { u.value = (resources[i] || {}).url || ""; });
    });
  }

  loadLearningForDate(todayISO);
  planDateEl.addEventListener("change", () => loadLearningForDate(planDateEl.value));

  document.getElementById("saveLearning").addEventListener("click", () => {
    const date = planDateEl.value;
    if (!date) return;
    const resources = [];
    titleInputs.forEach((t, i) => {
      if (t.value.trim() || urlInputs[i].value.trim()) {
        resources.push({ title: t.value.trim(), url: urlInputs[i].value.trim() });
      }
    });
    chrome.storage.local.get(["learningPlan"], ({ learningPlan = {} }) => {
      learningPlan[date] = {
        topic: planTopicEl.value.trim(),
        resources,
        completed: (learningPlan[date] || {}).completed || false
      };
      chrome.storage.local.set({ learningPlan }, () => flash("learningSaved"));
    });
  });

  // ── Blocklist tab ─────────────────────────────────────────────────────

  chrome.storage.local.get(["blocklist"], ({ blocklist = [] }) => {
    document.getElementById("blocklistText").value = blocklist.join("\n");
  });

  document.getElementById("saveBlocklist").addEventListener("click", () => {
    const lines = document.getElementById("blocklistText").value
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);
    chrome.storage.local.set({ blocklist: lines }, () => {
      chrome.runtime.sendMessage({ type: "UPDATE_BLOCKLIST", blocklist: lines }, () => {
        flash("blocklistSaved");
      });
    });
  });

  // ── Triggers tab ──────────────────────────────────────────────────────

  chrome.storage.local.get(["triggerWords"], ({ triggerWords = [] }) => {
    document.getElementById("triggersText").value = triggerWords.join("\n");
  });

  document.getElementById("saveTriggers").addEventListener("click", () => {
    const words = document.getElementById("triggersText").value
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);
    chrome.storage.local.set({ triggerWords: words }, () => flash("triggersSaved"));
  });

  // ── Data tab ──────────────────────────────────────────────────────────

  // Load streak counts into fields
  chrome.storage.local.get(["streaks"], ({ streaks = {} }) => {
    document.getElementById("alignedStreak").value  = streaks.alignedDays  || 0;
    document.getElementById("learningStreak").value = streaks.learningDays || 0;
  });

  document.getElementById("saveStreaks").addEventListener("click", () => {
    const aligned  = parseInt(document.getElementById("alignedStreak").value, 10)  || 0;
    const learning = parseInt(document.getElementById("learningStreak").value, 10) || 0;
    chrome.storage.local.get(["streaks"], ({ streaks = {} }) => {
      streaks.alignedDays  = aligned;
      streaks.learningDays = learning;
      chrome.storage.local.set({ streaks }, () => flash("streaksSaved"));
    });
  });

  // Export
  document.getElementById("exportData").addEventListener("click", () => {
    chrome.storage.local.get(null, data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anchor-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Import
  document.getElementById("importFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        chrome.storage.local.set(data, () => {
          const el = document.getElementById("dataStatus");
          el.textContent = "Import successful. Reloading…";
          el.removeAttribute("hidden");
          setTimeout(() => location.reload(), 1200);
        });
      } catch {
        const el = document.getElementById("dataStatus");
        el.textContent = "Error: could not parse JSON.";
        el.removeAttribute("hidden");
      }
    };
    reader.readAsText(file);
  });
})();
