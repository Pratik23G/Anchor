// db.js — IndexedDB wrapper using idb

import { openDB } from "idb";

const DB_NAME = "anchor";
const DB_VERSION = 1;

let _db = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Urge log: { id (auto), timestamp, completed }
      if (!db.objectStoreNames.contains("urges")) {
        const urges = db.createObjectStore("urges", { keyPath: "id", autoIncrement: true });
        urges.createIndex("by-date", "date");
      }
      // Journal entries: { date (key), prompts: [{q, a}] }
      if (!db.objectStoreNames.contains("journal")) {
        db.createObjectStore("journal", { keyPath: "date" });
      }
      // Learning plan: { date (key), topic, resources, completed }
      if (!db.objectStoreNames.contains("learning")) {
        db.createObjectStore("learning", { keyPath: "date" });
      }
      // Settings / streaks
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    }
  });
  return _db;
}

// ── Urges ─────────────────────────────────────────────────────────────────

export async function logUrge(completed = false) {
  const db = await getDB();
  const now = new Date();
  await db.add("urges", {
    timestamp: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    completed
  });
}

export async function markUrgeCompleted(id) {
  const db = await getDB();
  const urge = await db.get("urges", id);
  if (urge) {
    urge.completed = true;
    await db.put("urges", urge);
  }
}

export async function getUrgesForDate(date) {
  const db = await getDB();
  return db.getAllFromIndex("urges", "by-date", date);
}

// ── Journal ───────────────────────────────────────────────────────────────

export async function getJournalEntry(date) {
  const db = await getDB();
  return db.get("journal", date);
}

export async function saveJournalEntry(date, prompts) {
  const db = await getDB();
  await db.put("journal", { date, prompts, updatedAt: new Date().toISOString() });
}

// ── Learning plan ─────────────────────────────────────────────────────────

export async function getLearningEntry(date) {
  const db = await getDB();
  return db.get("learning", date);
}

export async function saveLearningEntry(entry) {
  // entry = { date, topic, resources, completed }
  const db = await getDB();
  await db.put("learning", entry);
}

export async function getLearningWeek(startDate) {
  const db = await getDB();
  const entries = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const entry = await db.get("learning", key);
    entries.push(entry || { date: key, topic: "", resources: [], completed: false });
  }
  return entries;
}

// ── Settings / Streaks ────────────────────────────────────────────────────

export async function getSetting(key) {
  const db = await getDB();
  const row = await db.get("settings", key);
  return row ? row.value : undefined;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put("settings", { key, value });
}

export async function getStreaks() {
  const db = await getDB();
  const a = await db.get("settings", "alignedDays");
  const l = await db.get("settings", "learningDays");
  const la = await db.get("settings", "lastAlignedDate");
  const ll = await db.get("settings", "lastLearningDate");
  return {
    alignedDays:     a?.value || 0,
    learningDays:    l?.value || 0,
    lastAlignedDate: la?.value || null,
    lastLearningDate: ll?.value || null
  };
}

export async function updateStreaks(patch) {
  const db = await getDB();
  for (const [key, value] of Object.entries(patch)) {
    await db.put("settings", { key, value });
  }
}

// ── Export / Import ───────────────────────────────────────────────────────

export async function exportAllData() {
  const db = await getDB();
  const data = {};
  for (const store of db.objectStoreNames) {
    data[store] = await db.getAll(store);
  }
  return data;
}

export async function importAllData(data) {
  const db = await getDB();
  for (const [store, records] of Object.entries(data)) {
    if (!db.objectStoreNames.contains(store)) continue;
    const tx = db.transaction(store, "readwrite");
    await tx.objectStore(store).clear();
    for (const record of records) {
      await tx.objectStore(store).put(record);
    }
    await tx.done;
  }
}
