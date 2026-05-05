// journal.js — daily reflection view

import { getAllPrompts } from "../lib/content.js";
import { getJournalEntry, saveJournalEntry } from "../lib/db.js";

const PROMPTS_PER_DAY = 3;

export async function renderJournal(container) {
  const today = new Date().toISOString().slice(0, 10);
  const allPrompts = getAllPrompts();
  const existing = await getJournalEntry(today);

  // Pick 3 prompts for today based on date
  const baseIdx = (Math.floor(Date.now() / 86400000) * PROMPTS_PER_DAY) % allPrompts.length;
  const prompts = [];
  for (let i = 0; i < PROMPTS_PER_DAY; i++) {
    prompts.push(allPrompts[(baseIdx + i) % allPrompts.length]);
  }

  const savedAnswers = (existing?.prompts || []).reduce((acc, p) => {
    acc[p.q] = p.a;
    return acc;
  }, {});

  const el = document.createElement("div");
  el.className = "view";

  el.innerHTML = `
    <header class="view-header">
      <p class="view-date">${formatDate(new Date())}</p>
      <p class="section-label" style="margin-top:0.25rem">daily reflection</p>
    </header>

    <div id="journal-prompts" style="display:flex;flex-direction:column;gap:1.75rem">
      ${prompts.map((p, i) => `
        <div class="journal-prompt-block">
          <p class="journal-prompt-text">${escHtml(p)}</p>
          <textarea
            class="journal-textarea"
            id="journal-ans-${i}"
            data-prompt="${escHtml(p)}"
            rows="3"
            placeholder="write here…"
          >${escHtml(savedAnswers[p] || "")}</textarea>
        </div>
      `).join("")}
    </div>

    <div style="display:flex;align-items:center;gap:1rem">
      <button class="journal-save-btn" id="journalSave">Save</button>
      <span class="journal-saved-msg" id="journalSavedMsg">Saved.</span>
    </div>
  `;

  container.appendChild(el);

  el.querySelector("#journalSave").addEventListener("click", async () => {
    const answers = prompts.map((p, i) => ({
      q: p,
      a: el.querySelector(`#journal-ans-${i}`).value.trim()
    }));
    await saveJournalEntry(today, answers);
    const msg = el.querySelector("#journalSavedMsg");
    msg.classList.add("visible");
    setTimeout(() => msg.classList.remove("visible"), 2000);
  });
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
