# Anchor

A focus and discipline system that helps you stay aligned with your values — blocking adult content, neutralizing addictive social media feeds, and replacing those triggers with daily learning, motivation, and reflection grounded in stoic, Hindu, and Buddhist teaching.

This is a personal tool, not a SaaS product. Built for one user, runs on your own devices, no accounts, no servers required.

---

## What's Here

| Piece | Where | What it does |
|---|---|---|
| Browser extension | `extension/` | Blocks sites, neutralizes feeds, overrides new tab |
| PWA | `pwa/` | Mobile home screen app: today view, urge button, journal, learning plan |
| Shared content | `shared/` | Master copy of quotes, blocklist, trigger words |

---

## Setup

### Step 1 — Download self-hosted fonts (required for full aesthetic)

```bash
cd anchor
bash scripts/download-fonts.sh
```

This downloads EB Garamond and Manrope from Google Fonts static servers as a one-time step and places them in `extension/fonts/` and `pwa/public/fonts/`. The app falls back to Georgia/system-serif if fonts are missing.

### Step 2 — Load the extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `anchor/extension/` folder
5. The Anchor icon appears in your toolbar

**Verify it works:**
- Open a new tab → should show today's quote, streak, and learning section
- Visit a site from the blocklist (e.g., add a test domain in Settings → Blocklist) → should redirect to the calm interstitial with a quote and breath circle
- Visit instagram.com → home feed should be hidden, replaced with an Anchor panel; DMs and search still work
- Open the extension popup → Settings page with Learning, Blocklist, Triggers, Data tabs

**Edge:** If prompted "Remove this extension?" when disabling Developer mode — keep it. Or use a profile dedicated to focused work.

### Step 3 — Run the PWA locally

```bash
cd anchor/pwa
npm install
npm run dev
```

Opens at `http://localhost:5173`. Works offline after first load (service worker caches the shell).

**Verify:**
- Home view: today's date, quote, streak numbers, task checkboxes, "I felt the urge" button
- Tap "I felt the urge" → breath circle animates through 4-7-8 pattern for 2 minutes → reflection prompt appears, answer saves to journal
- Learning tab → week view with editable day entries
- Journal tab → 3 daily prompts with text areas, Save button

### Step 4 — Deploy PWA to Netlify (to install on iPhone)

```bash
cd anchor/pwa
npm run build
```

Then deploy the `pwa/dist/` folder:

**Option A — Netlify drag-and-drop:**
1. Go to [app.netlify.com](https://app.netlify.com) → log in (free account)
2. Drag the `pwa/dist/` folder onto the dashboard
3. You get a URL like `https://anchor-abc123.netlify.app`

**Option B — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --dir pwa/dist --prod
```

**Install on iPhone from Safari:**
1. Open the deployed URL in Safari on your iPhone
2. Tap the Share button → **Add to Home Screen**
3. Tap **Add** → Anchor appears on your home screen
4. Opens full-screen, no browser chrome, caches for offline

> **iOS note:** All data is stored in IndexedDB on the device. If Safari "clears website data" (Settings → Safari → Advanced → Website Data), you'll lose journal/streak data. Export a backup regularly from Settings inside the app (coming: export button — for now, see the Data tab in the extension or manually).

---

## iOS Shortcuts — Getting Closer to a Live Widget

iOS doesn't allow PWAs to run as true native widgets. But you can get close:

**Lock Screen shortcut (iOS 16+):**
1. Long-press the lock screen → **Customize** → **Add Widgets**
2. Choose **Shortcuts** widget → pick a shortcut that opens the Anchor PWA URL
3. Create a Shortcut: *Open URL* → `https://your-anchor.netlify.app`
4. Add it to the lock screen

**Focus Mode automation:**
1. Settings → **Focus** → create a "Deep Work" focus
2. Under **Automation** → **Turn On Automatically** → at a set time or when opening certain apps
3. Also: Focus → **Home Screen** → add a custom home screen page showing only the Anchor PWA and essential apps

**Shortcut to log an urge without opening the app:**
1. Create a Shortcut: *Open URL* → `https://your-anchor.netlify.app/#intervention`
2. Add it to your home screen or lock screen
3. One tap opens straight to the intervention flow

**Siri integration:**
1. Name the shortcut "I need a moment" or similar
2. Siri phrase: "Hey Siri, I need a moment" → opens intervention screen

These are the closest you can get to a home screen widget without a native app. The PWA icon on your home screen is the primary entry point for daily use.

---

## Network-Level Blocking (Covers Mobile Browsers Too)

The extension only covers Chrome on Windows. For your phone's Safari and system-level blocking, add a DNS filter:

**NextDNS (recommended):**
1. Create a free account at [nextdns.io](https://nextdns.io)
2. Add your blocklist domains under **Denylist**
3. Enable **Adult Content** category blocking
4. Install the NextDNS profile on your iPhone: Settings → downloaded profile → Install
5. This blocks at the DNS level — covers Safari, apps, everything

**Cloudflare 1.1.1.3 (simpler, less configurable):**
1. iPhone: Settings → Wi-Fi → your network → Configure DNS → Manual → `1.1.1.3` and `1.0.0.3`
2. This uses Cloudflare's "Family" DNS which blocks adult content by category

Both work alongside Anchor. The extension handles fine-grained blocking + feed neutralization on desktop; DNS handles mobile and anything the extension misses.

---

## Editing Your Content

### Add quotes

Edit `shared/content.js`. Each quote has this shape:

```js
{
  id: "unique-id",
  text: "The quote text.",
  source: "Author, Book Chapter.Verse",
  tags: ["stoic"]  // one or more of: stoic, faith, discipline, intervention
}
```

After editing:
```bash
bash scripts/sync-content.sh
```

Then reload the extension in `chrome://extensions` and restart `npm run dev`.

### Edit the blocklist

**Extension:** Settings popup → Blocklist tab → one domain per line → Save  
**Or directly:** `shared/content.js` → `blocklist` array → run `sync-content.sh`

### Edit trigger words

Settings popup → Triggers tab → one word/phrase per line → Save

### Set today's learning topic

Settings popup → Learning tab → pick a date → fill in topic + up to 3 resource links → Save

---

## Backing Up Your Data

**Extension:**
Settings → Data tab → Export JSON → saves `anchor-backup-YYYY-MM-DD.json`

**PWA:**
Coming in v1.1. For now, your data lives in IndexedDB on the device. To back up manually:
Chrome DevTools → Application → IndexedDB → anchor → right-click and export, or use the export in the extension if you also use it on desktop with the same profile.

To **restore**: Settings → Data tab → Import JSON.

---

## File Structure

```
anchor/
├── shared/
│   ├── content.js          ← master content (edit this)
│   └── content.json        ← auto-generated by sync-content.sh
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── shared/content.js   ← copy of shared/content.js
│   ├── content-scripts/
│   │   ├── feed-neutralizer.js
│   │   ├── feed-neutralizer.css
│   │   └── trigger-interceptor.js
│   ├── newtab/
│   ├── interstitial/
│   ├── options/
│   ├── icons/
│   └── fonts/              ← populated by download-fonts.sh
├── pwa/
│   ├── src/
│   │   ├── main.js
│   │   ├── styles.css
│   │   ├── views/          ← home, learning, journal, intervention
│   │   ├── lib/            ← db.js, content.js
│   │   └── data/           ← content.json (copy of shared/)
│   └── public/
│       ├── fonts/          ← populated by download-fonts.sh
│       └── icons/
└── scripts/
    ├── download-fonts.sh
    └── sync-content.sh
```

---

## Definition of Done — v1 Checklist

- [ ] Extension installed in Chrome without errors
- [ ] New tab shows today's date, a quote, and streak numbers
- [ ] Blocked site shows the calm interstitial (quote + breath circle + go back link)
- [ ] Instagram home feed is hidden; DMs still open at instagram.com/direct/inbox/
- [ ] X.com / Twitter timeline is hidden; notifications still work
- [ ] YouTube home grid is hidden; a video URL plays normally
- [ ] "I felt the urge" button logs the moment and shows breath intervention (4-7-8, 2 min)
- [ ] Reflection answer after intervention saves to journal
- [ ] Journal tab shows 3 prompts, answers save and reload on re-visit
- [ ] Learning tab shows the week; days are editable
- [ ] Learning topic saved in extension options shows in new tab
- [ ] Streak numbers increment on task completion
- [ ] PWA installs on iPhone home screen from Safari
- [ ] PWA loads offline after first visit
- [ ] Data export from extension produces a valid JSON file
- [ ] No external network requests at runtime (all data local)

---

## What Works vs. What's Stubbed

**Fully working:**
- Site blocking via declarativeNetRequest (redirects to interstitial)
- Interstitial: quote, breath animation, 60-second countdown, go back
- New tab: date, rotating daily quote, learning plan, streak display, journal prompt
- Feed neutralizer: CSS hiding + replacement panel for Instagram, X, YouTube, Reddit, Facebook, TikTok
- Trigger word interceptor: search form submissions on Google/Bing/DuckDuckGo
- Options page: all 4 tabs (Learning, Blocklist, Triggers, Data), export/import
- PWA home: quote, streaks, task checkboxes, urge button
- Intervention flow: 4-7-8 breath animation, 2-minute timer, reflection prompt
- Learning plan: weekly view, edit any day's topic + 3 resources
- Journal: 3 daily prompts, save/reload, answers saved to IndexedDB
- Service worker: offline caching of app shell
- Data export (extension): full chrome.storage.local dump as JSON

**Stubbed / v1.1:**
- PWA data export button (UI not yet wired — use IndexedDB export from DevTools for now)
- Feed neutralizer CSS selectors will need tuning as Instagram/X update their HTML structure
- The `trigger-interceptor.js` catches typed searches on search engine pages but not URL bar typing (browser limitation — DNS blocking covers this)
- Streak "aligned day" logic: currently only learning days auto-increment; aligned days are set manually in Options → Data. Full auto-logic needs a daily background job (v1.1)
