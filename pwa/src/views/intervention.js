// intervention.js — the "I felt the urge" intervention flow
// 4-7-8 breath cycle, 2-minute timer, reflection prompt saved to journal.

import { getRandomQuote } from "../lib/content.js";
import { markUrgeCompleted, saveJournalEntry, getJournalEntry } from "../lib/db.js";

const BREATH_PHASES = [
  { name: "breathe in",  duration: 4000,  scale: 1.45 },
  { name: "hold",        duration: 7000,  scale: 1.45 },
  { name: "breathe out", duration: 8000,  scale: 0.72 }
];

const TOTAL_SECONDS = 120; // 2 minutes

export function showIntervention(container, onDone) {
  const quote = getRandomQuote("intervention") || getRandomQuote("faith");
  const nav = document.getElementById("nav");
  if (nav) nav.style.display = "none"; // hide bottom nav during intervention

  const el = document.createElement("div");
  el.className = "intervention-view";

  el.innerHTML = `
    <div class="intervention-breath-wrap">
      <div class="intervention-ring">
        <div class="intervention-circle" id="ivCircle"></div>
      </div>
      <p class="intervention-breath-label" id="ivLabel">breathe in</p>
    </div>

    <div class="intervention-timer-bar">
      <div class="intervention-timer-progress" id="ivProgress"></div>
    </div>

    ${quote ? `
    <div class="intervention-quote-block quote-block">
      <p class="quote-text">${escHtml(quote.text)}</p>
      <p class="quote-source">— ${escHtml(quote.source)}</p>
    </div>
    ` : ""}

    <button class="intervention-exit-btn" id="ivSkip">skip →</button>
  `;

  container.innerHTML = "";
  container.appendChild(el);

  // ── Breath animation ──────────────────────────────────────────────────

  const circle = el.querySelector("#ivCircle");
  const label  = el.querySelector("#ivLabel");
  let phaseIdx = 0;
  let breathTimer = null;

  function runPhase() {
    const phase = BREATH_PHASES[phaseIdx % BREATH_PHASES.length];
    circle.style.transform = `scale(${phase.scale})`;
    circle.style.transition = `transform ${phase.duration}ms ease-in-out`;
    label.textContent = phase.name;
    phaseIdx++;
    breathTimer = setTimeout(runPhase, phase.duration);
  }

  setTimeout(runPhase, 400);

  // ── 2-minute countdown progress bar ──────────────────────────────────

  const progressEl = el.querySelector("#ivProgress");
  let elapsed = 0;

  const tick = setInterval(() => {
    elapsed++;
    const pct = Math.max(0, 1 - elapsed / TOTAL_SECONDS);
    progressEl.style.transform = `scaleX(${pct})`;
    if (elapsed >= TOTAL_SECONDS) {
      clearInterval(tick);
      clearTimeout(breathTimer);
      showReflection(el, container, onDone, nav);
    }
  }, 1000);

  // ── Skip ──────────────────────────────────────────────────────────────

  el.querySelector("#ivSkip").addEventListener("click", () => {
    clearInterval(tick);
    clearTimeout(breathTimer);
    showReflection(el, container, onDone, nav);
  });
}

// ── Reflection prompt (shown after breath completes) ──────────────────────

function showReflection(el, container, onDone, nav) {
  el.innerHTML = `
    <div class="intervention-view" style="gap:1.5rem">
      <p class="reflection-prompt">What were you actually feeling<br>10 minutes ago?</p>
      <textarea
        class="journal-textarea"
        id="ivAnswer"
        rows="4"
        placeholder="Write freely — this is only for you."
        style="width:100%;max-width:320px"
      ></textarea>
      <button class="btn-primary" id="ivSave">Save &amp; return</button>
    </div>
  `;

  el.querySelector("#ivSave").addEventListener("click", async () => {
    const answer = el.querySelector("#ivAnswer").value.trim();
    const today = new Date().toISOString().slice(0, 10);

    if (answer) {
      const existing = await getJournalEntry(today);
      const prompts = existing?.prompts || [];
      prompts.push({ q: "What were you actually feeling 10 minutes ago?", a: answer });
      await saveJournalEntry(today, prompts);
    }

    if (nav) nav.style.display = "";
    onDone();
  });
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
