# Anchor

A focus and discipline system that helps me stay aligned with my values — blocking adult content, neutralizing addictive social media feeds, and replacing those triggers with daily learning, motivation, and reflection grounded in faith and stoic discipline.

This is a personal tool, not a SaaS product. Built for one user (me), runs on my own devices, no accounts, no servers required for v1.

## The Problem

Phones and laptops are designed to hijack attention. Infinite scroll, algorithmic feeds, and one-click access to adult content create dopamine traps that pull me away from who I want to be. Willpower alone isn't enough — the environment has to be designed for the person I'm trying to become.

## The Approach

Three layers, working together:

1. **Block** what shouldn't be reachable (adult sites, known time-sinks).
2. **Neutralize** what's necessary but addictive (hide social feeds, keep DMs).
3. **Replace** the empty moments with something that compounds (learning, quotes, reflection).

## What We're Building (v1 scope)

A connected pair:

### A. Browser Extension (Chrome / Edge / Firefox via Manifest V3)
Runs on my laptop. Does the heavy lifting on desktop.

- **Site blocker** with a configurable blocklist (adult content default list + custom additions). Blocked pages show a full-screen interstitial with a quote, a breath timer, and a "this will pass" message — not a generic block error.
- **Feed neutralizer** for Instagram, X/Twitter, YouTube, TikTok, Reddit, Facebook. Hides the feed/recommendations via CSS injection but keeps DMs, notifications, search, and direct profile visits working. Replaces the feed area with today's quote and learning task.
- **New Tab override** showing: today's date, current streak, today's learning topic with links, one rotating quote, one quick journal prompt.
- **Trigger-word interceptor**: if I type known trigger words into a search bar or URL, intercept with the same interstitial.
- **Local-only data** via `chrome.storage.local`. No telemetry, no external calls except for fetching the day's content if I add it.

### B. PWA (installable on iOS + Android home screen, also works on desktop)
The mobile companion. Pure web — no app stores, no native code.

- Home screen widget-style layout: today's quote (large, beautiful), streak counter, today's 3 learning tasks with checkboxes, a "I felt the urge" button that logs the moment and shows an intervention screen.
- Daily learning plan view: a week at a glance, each day has a topic + 1-3 resource links I've added.
- Journal: short daily reflection (3 prompts, one-tap).
- Streak tracking: days clean, days with learning completed, days with reflection.
- Installable as PWA (manifest.json + service worker for offline).
- **Local-only data** via IndexedDB. Optional export/import as JSON so I can move data between devices manually.

### C. Shared content layer
A single `content.js` (extension) and matching `content.json` (PWA) that hold:
- Quote library (categorized: stoic, faith, discipline, intervention)
- Default blocklist
- Default trigger words
- Learning plan template (editable by me)

Both apps read from the same shape so I can sync by copying one file.

## Out of Scope for v1

- Native iOS or Android app (PWA covers it; native is v2 if I want system-level mobile blocking)
- Cloud sync / accounts / backend
- DNS-level blocking (handled separately by setting device DNS to NextDNS or Cloudflare 1.1.1.3 — document this in setup, don't build it)
- Accountability partner features
- Analytics dashboards beyond a simple streak

## Tech Stack

- **Extension**: Vanilla JS + Manifest V3. No build step. Plain HTML/CSS/JS in folders. Easier to audit and modify.
- **PWA**: Vanilla JS + Vite for the dev server and build. No React unless a specific view genuinely needs it. Keep it lean.
- **Styling**: Custom CSS, no Tailwind. The aesthetic matters here — this is something I'll see every day, it shouldn't look like a generic dashboard.
- **Storage**: `chrome.storage.local` (extension), IndexedDB via `idb` (PWA).
- **No tracking, no analytics, no external fonts loaded at runtime** (self-host or use system stack).

## Aesthetic Direction

Not a productivity app. Not a porn-blocker app (those all look punitive and shameful). Think: a quiet monastery library at dawn. Warm off-white or deep ink background. One serif display font for quotes (something like Cormorant, Fraunces, or EB Garamond — self-hosted). One clean sans for UI (Inter is fine here, or system stack). Generous whitespace. Slow, deliberate transitions. The interstitial when I hit a blocked site should feel like a hand on my shoulder, not a slap.

Avoid: red warning colors, padlock icons, "BLOCKED!" all-caps, shame language, gamified streak fire emojis everywhere.

## File Structure

```
anchor/
├── README.md
├── shared/
│   ├── content.js           # quotes, blocklist, triggers (extension import)
│   └── content.json         # same data, JSON form (PWA import)
├── extension/
│   ├── manifest.json
│   ├── background.js        # blocking logic via declarativeNetRequest
│   ├── content-scripts/
│   │   ├── feed-neutralizer.js
│   │   └── feed-neutralizer.css
│   ├── newtab/
│   │   ├── newtab.html
│   │   ├── newtab.css
│   │   └── newtab.js
│   ├── interstitial/
│   │   ├── blocked.html
│   │   ├── blocked.css
│   │   └── blocked.js
│   ├── options/
│   │   ├── options.html     # edit blocklist, triggers, today's learning topic
│   │   ├── options.css
│   │   └── options.js
│   └── icons/
│       └── (16, 32, 48, 128 png — generate placeholders)
└── pwa/
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js                # service worker for offline
    ├── src/
    │   ├── main.js
    │   ├── styles.css
    │   ├── views/
    │   │   ├── home.js      # today view
    │   │   ├── learning.js  # weekly plan
    │   │   ├── journal.js
    │   │   └── intervention.js  # the "I felt the urge" flow
    │   └── lib/
    │       ├── db.js        # IndexedDB wrapper
    │       └── content.js   # loads content.json
    ├── public/
    │   ├── icons/           # PWA icons (192, 512, maskable)
    │   └── fonts/           # self-hosted display + body fonts
    ├── package.json
    └── vite.config.js
```

## Key Behaviors to Get Right

**The blocked-page interstitial.** This is the most important screen in the whole project. When I hit a blocked URL, the page should show: a calm full-screen layout, one relevant quote (rotated from the `intervention` and `faith` tagged quotes), a 60-second breath timer that auto-starts, and a single small link "go back" — no "unblock" button, no override. The point is friction and a moment of pause, not a wall.

**The feed neutralizer.** Don't break the sites. Hide via CSS the specific selectors for the algorithmic feed on each site:
- Instagram: home feed, Reels tab, Explore
- X/Twitter: For You and Following timelines, Trends sidebar
- YouTube: home recommendations, Shorts shelf, sidebar recommendations on watch pages
- TikTok: For You feed
- Reddit: home feed, popular
- Facebook: news feed

Keep working: search, DMs, notifications, profile pages I navigate to directly, watch-later/saved, settings. Inject a replacement panel where the feed was, showing today's quote + today's learning task + a "why am I here?" prompt.

**The "I felt the urge" button (PWA).** When tapped: log timestamp to IndexedDB, show full-screen intervention view with a rotating intervention quote, a 2-minute guided breath animation (4-7-8 breathing visualized as an expanding/contracting circle), and at the end one prompt: "What were you actually feeling 10 minutes ago?" — saved to journal. No streak penalty. The point is awareness, not punishment.

**The learning plan.** Simple. Each day has: one topic (string), 1-3 resource links (title + url), a "done" checkbox. I enter these myself in the options/settings page. No AI generation, no curation — this is mine to fill in. Show today prominently, the rest of the week subtly below.

**Streak.** Two streaks tracked separately:
- "Aligned days" — days I didn't tap the urge button or where I tapped it but completed the intervention
- "Learning days" — days I completed at least one learning task
Don't gamify with fire emojis. Show as a quiet number with a small visual: "31 aligned days · 18 learning days."

## Setup Documentation (include in README)

The final README should explain to me, in plain steps:

1. How to load the unpacked extension into Chrome/Edge/Firefox dev mode
2. How to run the PWA locally (`npm install`, `npm run dev`)
3. How to deploy the PWA to Netlify or Vercel for free so I can install it on my phone
4. How to set up NextDNS or Cloudflare 1.1.1.3 on my phone and laptop as the network-level layer (this catches what the extension can't, especially on mobile)
5. How to edit `content.js` / `content.json` to add my own quotes, sites, and learning plan
6. How to back up my data (export JSON from PWA, copy `chrome.storage.local` from extension)

## Definition of Done for v1

- I can install the extension in Chrome and it actually blocks a test site with the calm interstitial
- I can visit Instagram and the feed is gone, replaced with my quote and today's task, but DMs still work
- The new tab page shows today's content
- I can install the PWA on my iPhone home screen and it opens offline
- I can tap "I felt the urge" and complete the breath intervention
- I can add a learning topic for today in the options/settings and it appears in both the extension new tab and the PWA
- All data is local. I can export it as JSON.

Build this carefully. Ship the extension and PWA in working state. Don't over-engineer — vanilla JS, simple structure, beautiful execution.
