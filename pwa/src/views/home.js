// home.js — today view

import { getDailyQuote, getDailyPrompt } from "../lib/content.js";
import { getLearningEntry, saveLearningEntry, getStreaks, updateStreaks, logUrge } from "../lib/db.js";

export async function renderHome(container) {
  const today = new Date().toISOString().slice(0, 10);
  const quote = getDailyQuote();
  const prompt = getDailyPrompt();
  const [plan, streaks] = await Promise.all([
    getLearningEntry(today),
    getStreaks()
  ]);

  const el = document.createElement("div");
  el.className = "view";
  el.innerHTML = `
    <header class="view-header">
      <p class="view-date">${formatDate(new Date())}</p>
    </header>

    <section class="quote-block">
      ${quote ? `
        <p class="quote-text">${escHtml(quote.text)}</p>
        <p class="quote-source">— ${escHtml(quote.source)}</p>
      ` : `<p class="empty-state">No quote loaded.</p>`}
    </section>

    <section>
      <p class="section-label">today's practice</p>
      ${renderTasks(plan, today)}
    </section>

    <section class="streak-row">
      <div class="streak-item">
        <span class="streak-count">${streaks.alignedDays}</span>
        <span class="streak-label">aligned days</span>
      </div>
      <div class="streak-item">
        <span class="streak-count">${streaks.learningDays}</span>
        <span class="streak-label">learning days</span>
      </div>
    </section>

    ${prompt ? `
    <section>
      <p class="section-label">reflect</p>
      <p class="journal-prompt-text">${escHtml(prompt)}</p>
    </section>
    ` : ""}

    <button class="urge-btn" id="urgeBtn">I felt the urge</button>
  `;

  container.appendChild(el);
  bindTaskCheckboxes(el, plan, today);
  bindUrgeButton(el);
}

// ── Task rendering ────────────────────────────────────────────────────────

function renderTasks(plan, _today) {
  if (!plan || !plan.topic) {
    return `<p class="empty-state">No learning topic set for today.</p>`;
  }
  const items = (plan.resources || []).map((r, i) => `
    <li class="task-item${plan.completed ? " completed" : ""}" data-idx="${i}">
      <input type="checkbox" id="task-${i}" ${plan.completed ? "checked" : ""}>
      <span>
        ${escHtml(plan.topic)}
        ${r.url ? `<a class="task-resource" href="${escHtml(r.url)}" target="_blank" rel="noopener">${escHtml(r.title || r.url)} ↗</a>` : ""}
      </span>
    </li>
  `);

  if (!plan.resources || !plan.resources.length) {
    return `
      <ul class="task-list">
        <li class="task-item${plan.completed ? " completed" : ""}">
          <input type="checkbox" id="task-0" ${plan.completed ? "checked" : ""}>
          <span>${escHtml(plan.topic)}</span>
        </li>
      </ul>`;
  }
  return `<ul class="task-list">${items.join("")}</ul>`;
}

// ── Task checkboxes ───────────────────────────────────────────────────────

function bindTaskCheckboxes(el, plan, today) {
  el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", async () => {
      const entry = (await getLearningEntry(today)) || { date: today, topic: plan?.topic || "", resources: plan?.resources || [] };
      entry.completed = cb.checked;
      await saveLearningEntry(entry);

      // Update learning streak
      const streaks = await getStreaks();
      if (cb.checked && streaks.lastLearningDate !== today) {
        await updateStreaks({
          learningDays: streaks.learningDays + 1,
          lastLearningDate: today
        });
        const countEl = el.querySelector(".streak-item:last-child .streak-count");
        if (countEl) countEl.textContent = streaks.learningDays + 1;
      }
    });
  });
}

// ── Urge button ───────────────────────────────────────────────────────────

function bindUrgeButton(el) {
  el.querySelector("#urgeBtn")?.addEventListener("click", async () => {
    await logUrge(false);
    window.__anchorShowIntervention?.();
  });
}

// ── Utils ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
