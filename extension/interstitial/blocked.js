// blocked.js — interstitial page logic

(function () {
  const quotes = (window.ANCHOR_CONTENT || {}).quotes || [];
  const interventionQuotes = quotes.filter(q =>
    q.tags.includes("intervention") || q.tags.includes("faith")
  );

  function pickQuote() {
    if (!interventionQuotes.length) return null;
    return interventionQuotes[Math.floor(Math.random() * interventionQuotes.length)];
  }

  function renderQuote() {
    const q = pickQuote();
    if (!q) return;
    document.getElementById("quoteText").textContent = "“" + q.text + "”";
    document.getElementById("quoteSource").textContent = "— " + q.source;
  }

  // ── Breath animation (4s in / 4s out, gentle) ─────────────────────────

  const circle = document.getElementById("breathCircle");
  const label = document.getElementById("breathLabel");

  const phases = [
    { name: "breathe in",  duration: 4000, scale: 1.4 },
    { name: "hold",        duration: 4000, scale: 1.4 },
    { name: "breathe out", duration: 5000, scale: 0.75 }
  ];
  let phaseIdx = 0;

  function runBreath() {
    const phase = phases[phaseIdx % phases.length];
    circle.style.transform = `scale(${phase.scale})`;
    circle.style.transition = `transform ${phase.duration}ms ease-in-out`;
    label.textContent = phase.name;
    phaseIdx++;
    setTimeout(runBreath, phase.duration);
  }

  // Short delay so the CSS transition is visible from the start
  setTimeout(runBreath, 300);

  // ── 60-second countdown ───────────────────────────────────────────────

  const timerEl = document.getElementById("timer");
  let remaining = 60;

  const tick = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining;
    if (remaining <= 0) clearInterval(tick);
  }, 1000);

  // ── Go back ───────────────────────────────────────────────────────────

  document.getElementById("backLink").addEventListener("click", e => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.go(-1);
    } else {
      window.close();
    }
  });

  renderQuote();
})();
