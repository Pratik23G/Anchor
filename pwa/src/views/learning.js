// learning.js — weekly learning plan view

import { getLearningWeek, saveLearningEntry } from "../lib/db.js";

export async function renderLearning(container) {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekMonday(new Date());
  const week = await getLearningWeek(weekStart.toISOString().slice(0, 10));

  const el = document.createElement("div");
  el.className = "view";

  el.innerHTML = `
    <header class="view-header">
      <p class="section-label">this week</p>
    </header>
    <div id="week-list"></div>
    <div id="edit-panel" style="display:none">
      <p class="section-label">edit day</p>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <input class="journal-textarea" type="text" id="edit-topic" placeholder="Topic for this day" style="min-height:auto;padding:0.55rem 0.75rem">
        <div id="edit-resources" style="display:flex;flex-direction:column;gap:0.35rem"></div>
        <button class="journal-save-btn" id="edit-save">Save</button>
        <button class="journal-save-btn" id="edit-cancel" style="background:#8B7D6B;margin-top:-0.25rem">Cancel</button>
      </div>
    </div>
  `;

  container.appendChild(el);
  renderWeek(el, week, today);
}

function renderWeek(root, week, today) {
  const list = root.querySelector("#week-list");
  list.innerHTML = "";

  week.forEach((day, _i) => {
    const isToday = day.date === today;
    const d = new Date(day.date + "T00:00:00");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const section = document.createElement("div");
    section.className = "week-day";

    section.innerHTML = `
      <div class="week-day-header">
        <span class="week-day-name${isToday ? " today" : ""}">${dayName}</span>
        <span class="week-day-date">${dateStr}</span>
      </div>
      <p class="week-day-topic${!day.topic ? " empty" : ""}">${
        day.topic ? escHtml(day.topic) : "No topic"
      }</p>
      ${renderResources(day.resources)}
      ${day.topic ? `<span class="done-marker" style="font-size:0.75rem;color:${day.completed ? "#8B6F47" : "#C9BDB0"};letter-spacing:0.04em">${day.completed ? "✓ done" : "not yet"}</span>` : ""}
      <button class="edit-day-btn" data-date="${day.date}" style="
        background:none;border:none;cursor:pointer;font-family:inherit;
        font-size:0.75rem;color:#B8A898;letter-spacing:0.04em;padding:0.25rem 0;
        margin-top:0.25rem;display:block;transition:color 0.15s
      ">edit ↗</button>
    `;

    list.appendChild(section);
  });

  // Edit button handlers
  root.querySelectorAll(".edit-day-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditPanel(root, btn.dataset.date, week));
  });
}

function renderResources(resources) {
  if (!resources || !resources.length) return "";
  return `<ul style="list-style:none;margin:0.25rem 0 0.25rem 0;display:flex;flex-direction:column;gap:0.2rem">
    ${resources.filter(r => r.url || r.title).map(r => `
      <li>
        ${r.url
          ? `<a class="task-resource" href="${escHtml(r.url)}" target="_blank" rel="noopener">${escHtml(r.title || r.url)}</a>`
          : `<span style="font-size:0.78rem;color:#8B7D6B">${escHtml(r.title)}</span>`
        }
      </li>`).join("")}
  </ul>`;
}

function openEditPanel(root, date, week) {
  const panel = root.querySelector("#edit-panel");
  const topicEl = root.querySelector("#edit-topic");
  const resEl = root.querySelector("#edit-resources");
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.gap = "0.75rem";

  const existing = week.find(d => d.date === date) || { date, topic: "", resources: [], completed: false };
  topicEl.value = existing.topic || "";

  // Build 3 resource rows
  resEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const r = (existing.resources || [])[i] || {};
    const row = document.createElement("div");
    row.style.cssText = "display:grid;grid-template-columns:1fr 1.4fr;gap:0.4rem";
    row.innerHTML = `
      <input class="journal-textarea" type="text" placeholder="Title" value="${escHtml(r.title||"")}" data-r="${i}" data-field="title" style="min-height:auto;padding:0.45rem 0.6rem;font-family:inherit;font-size:0.85rem">
      <input class="journal-textarea" type="url" placeholder="https://" value="${escHtml(r.url||"")}" data-r="${i}" data-field="url" style="min-height:auto;padding:0.45rem 0.6rem;font-family:inherit;font-size:0.85rem">
    `;
    resEl.appendChild(row);
  }

  root.querySelector("#edit-save").onclick = async () => {
    const resources = [];
    for (let i = 0; i < 3; i++) {
      const title = resEl.querySelector(`[data-r="${i}"][data-field="title"]`).value.trim();
      const url   = resEl.querySelector(`[data-r="${i}"][data-field="url"]`).value.trim();
      if (title || url) resources.push({ title, url });
    }
    const entry = { date, topic: topicEl.value.trim(), resources, completed: existing.completed };
    await saveLearningEntry(entry);
    // Update week array in place and re-render
    const idx = week.findIndex(d => d.date === date);
    if (idx > -1) week[idx] = entry;
    panel.style.display = "none";
    renderWeek(root, week, new Date().toISOString().slice(0, 10));
  };

  root.querySelector("#edit-cancel").onclick = () => {
    panel.style.display = "none";
  };
}

function getWeekMonday(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
