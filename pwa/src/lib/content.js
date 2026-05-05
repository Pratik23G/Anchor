// content.js — loads content.json for the PWA

import data from "../data/content.json";

export const quotes = data.quotes || [];
export const journalPrompts = data.journalPrompts || [];

export function getDailyQuote() {
  if (!quotes.length) return null;
  const idx = Math.floor(Date.now() / 86400000) % quotes.length;
  return quotes[idx];
}

export function getRandomQuote(tag) {
  const pool = tag ? quotes.filter(q => q.tags.includes(tag)) : quotes;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getDailyPrompt() {
  if (!journalPrompts.length) return "";
  const idx = Math.floor(Date.now() / 86400000) % journalPrompts.length;
  return journalPrompts[idx];
}

export function getAllPrompts() {
  return journalPrompts;
}
