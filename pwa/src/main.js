// main.js — app entry point, router, service worker registration

import { renderHome }         from "./views/home.js";
import { renderLearning }     from "./views/learning.js";
import { renderJournal }      from "./views/journal.js";
import { showIntervention }   from "./views/intervention.js";

// ── Service worker ────────────────────────────────────────────────────────

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// ── Router ────────────────────────────────────────────────────────────────

const views = {
  home:     renderHome,
  learning: renderLearning,
  journal:  renderJournal
};

const container = document.getElementById("viewContainer");
const navBtns   = document.querySelectorAll(".nav-btn");

function navigate(view) {
  if (!views[view]) view = "home";

  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  container.innerHTML = "";
  views[view](container);

  // Keep hash in sync so back/forward works
  history.replaceState(null, "", "#" + view);
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.view));
});

// Expose for use by views (e.g. urge button → intervention screen)
window.__anchorNavigate = navigate;
window.__anchorShowIntervention = () => showIntervention(container, () => navigate("home"));

// ── Initial render ────────────────────────────────────────────────────────

const initial = location.hash.slice(1) || "home";
navigate(initial);
