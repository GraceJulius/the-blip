<p align="center"><img src="public/logo.png" alt="TheBlip logo" width="220"></p>

# TheBlip

See the real cost before you swipe. TheBlip helps college students make better credit decisions, spot scams, and level up by building safe money habits. Banks plug it in through a small event API.

> Every card pays you to spend. We pay you to not get hurt.

Built for SteelHacks XIII.

**Live demo:** https://theblip.tech

## Team

| Name | Email |
| --- | --- |
| Grace Julius | juliusgrace65@gmail.com |
| Aryannah Martin | (add email) |
| Jaemere Gamble | jaemere.gamble@gmail.com |

Built for the **PNC Compound** track (best financial hack), and it also uses NVIDIA Nemotron, Tiger Cloud (Tiger Data), DigitalOcean and a `.tech` domain.

## Tools and AI we used (disclosure)

- **AI in the product:**
  - **Anthropic Claude** reads card statements and receipts, turns a plain request into a grocery list, writes short summaries, and translates warnings into other languages. Claude never does the math: prices, totals and interest are computed by our code.
  - **NVIDIA Nemotron** checks every message for the scam check. Plain rules and a small local classifier run alongside it, explain the verdict, and are the backup if the model is slow or off (the screen says when that happens).
- **AI used to build it:** we used **Claude Code (Anthropic)** as a coding assistant for much of the code, tests and documentation. Team members reviewed, ran and directed the work.
- **Voice:** **ElevenLabs** text to speech reads warnings aloud, in several languages (optional). Without a key the browser's built-in voice is used.
- **Services:** Tiger Cloud (Tiger Data) Postgres for saved state, DigitalOcean App Platform for hosting, a `.tech` domain from MLH.
- **Open source:** Next.js and React, Leaflet with OpenStreetMap map tiles, `pg`, `zod`, `@anthropic-ai/sdk`.
- The project was started after the hackathon opened (first commit Sept 19, 2026, 11:34 AM EDT).

## Sandbox bank feed

Open `/bank` and use **Sandbox bank feed**. It is a made-up student with made-up money. Each button is an event a real bank would send:

| Event | What TheBlip does |
| --- | --- |
| Paycheck arrives | Suggests moving a small amount to savings. Reaching $100 completes the emergency fund quest. |
| Big purchase at 2 AM | Alerts the student and offers to freeze the card. |
| Payment to a new person | Flags a likely advance-fee scam and opens "Before you send money" already filled in. |
| Gift cards bought | Alerts that gift cards are a scam signal. |
| Rent autopay runs | Warns when the balance gets low. |
| Card bill paid early | Awards the pay-on-time quest. |

The reaction is rule-based and shows on the student's **Home** screen (open the student app in another tab or on a phone). The account lives in the browser, so the server keeps no bank data, only the alert text. A real bank would send the same kind of events through the partner API (`docs/API.md`).

## Read aloud

Warnings have a **Read aloud** button, for accessibility and for people who scan rather than read. With `ELEVENLABS_API_KEY` set, the server calls ElevenLabs (`/api/tts`, rate limited, at most 700 characters, cached). Without a key, or if the service is down, the button uses the browser's built-in voice, so it always works. Nothing spoken is stored.

## Languages and accessibility

**Pick a language** with the globe menu (top right, or in the sidebar). It is remembered in that browser only.

- **The app in your language:** the menus, buttons, tips and the safety screens (Home, Scam check, "Before you send money", Recovery) switch language. The text comes from pre-built dictionaries in `public/i18n/<language>.json`, so it loads instantly, works offline and can be reviewed by a native speaker. Regenerate or extend them with `node scripts/build-i18n.mjs` (it only translates new strings). Arabic and Urdu switch the page to right-to-left.
- **Warnings and alerts:** results are also translated live by Claude into simple words for an older reader, shown in large type, and can be read aloud. The original English stays on screen.
- **Voice (ElevenLabs):** Multilingual v2 covers Spanish, French, Portuguese, Arabic, Hindi, Tamil, Chinese, Japanese, Korean, Filipino, Indonesian, Russian, Ukrainian, Polish, German, Italian, Dutch, Turkish and English. Eleven v3 covers Hausa, Swahili, Somali, Bengali, Urdu and Vietnamese. **Yorùbá, Igbo, Amharic and Haitian Creole are not on ElevenLabs' language lists**, so they are text only. We tried a Yorùbá voice and its intonation was wrong, so it stays off. To experiment, set `ELEVENLABS_VOICE_ON_LANGS=yo`.
- **Honest limits:** all translations are AI-made and labeled that way, and a native speaker should review them. Quests, Reality check and Groceries screens, quest titles and level names are still English. The scam rules read English, so a message pasted in another language relies on the model.

**Accessibility (screen readers and keyboards)**

- A "Skip to main content" link, labeled landmarks (sidebar, menu, main), and `aria-current` on the page you are on.
- Every input on the safety screens has a real label. Sliders announce their values. Results are announced as they appear.
- File upload buttons can be reached and used from the keyboard.
- Dialogs trap focus, close with Escape, and return focus. Motion respects "reduce motion".
- Color contrast passes WCAG AA (small gray labels were raised from 3.98:1 to 5.85:1).
- The page language and direction update when you change language.
- We ran the axe-core accessibility checker on the server-rendered pages and fixed what it found. We have not done a full test with VoiceOver, TalkBack or NVDA, and would like to.

## Data: synthetic only

This project uses **synthetic and sample data only**. No real account numbers, credentials or financial records are needed to use it or to judge it.

- The reality check has a **"Use a sample statement"** button with a made-up statement. Please use it, and do not upload real account documents.
- Grocery prices are **samples** unless a student scans a receipt, and the app says so on screen.
- The bank console's students and events are **simulated**. Payouts and gift cards are simulated too.
- Nothing pasted or uploaded to the scam check, payment check, statement reader or receipt scanner is stored.

## Quick start

You need Node.js 18 or newer (`node -v` to check; install from https://nodejs.org or `brew install node`).

```bash
npm install
cp .env.example .env.local   # optional: only needed for Nemotron
npm run dev
```

Open http://localhost:3000.

Try the demo flow in two browser tabs:
1. Tab A: `/quests`
2. Tab B: `/bank` and click **Send event**. Tab A updates within 2 seconds.

Reset demo data any time with the button on `/bank`.

## Project structure

```
the-blip/
├── app/                          The website and its API (Next.js App Router)
│   ├── page.js                   Home: level, next quest, tools
│   ├── check/                    Reward reality check, payoff plan, statement reader
│   ├── scam/                     Scam check: a message, or "before you send money"
│   ├── quests/                   Quests, points, quiz and gift-card redeem (simulated)
│   ├── recovery/                 Recovery mode: steps to take after a scam
│   ├── groceries/                Grocery compare: price, health, swaps, receipt scan
│   ├── food/                     Free food map (Leaflet) with open-now status
│   ├── bank/                     Bank simulator: sandbox bank feed and demo events
│   ├── console/                  Bank console: overview, program settings, integration
│   ├── docs/                     Public API documentation page
│   ├── embed/                    Embeddable widget page for partner sites
│   ├── Shell.js, Onboarding.js   App frame, navigation, first-visit tips
│   ├── i18n.js, lang.js, useLang.js   Language picker and the t() function for the interface
│   ├── Translated.js             Live translated warnings
│   ├── ReadAloud.js              "Read aloud" button (ElevenLabs voice, browser voice as backup)
│   ├── globals.css               Design tokens and styling
│   └── api/                      Server routes
│       ├── scam-check/           Rules first, then the model for borderline messages
│       ├── payment-check/        Rule-based check of a payment request
│       ├── sandbox-bank/         Synthetic bank feed: transaction in, student alert out
│       ├── tts/                  Text to speech for the read-aloud button
│       ├── translate/            Translates our warnings (Claude)
│       ├── statement/, groceries/  Claude reads statements and receipts, plans lists
│       ├── events/, state/, quests/, redeem/, recovery/   Points engine endpoints
│       ├── v1/                   Public partner API (API keys, rate limited)
│       ├── embed/                Widget data (signed tokens)
│       └── admin/, reset/, stats/  Console, analytics, demo reset (password protected)
├── lib/                          Logic shared by the app (no UI)
│   ├── engine.js, quests.js, levels.js   Points, quests and levels
│   ├── store.js, snapshot.mjs, pgStore.mjs  In-memory state with file or Postgres snapshots
│   ├── scamRules.mjs, paymentRules.mjs   Plain-language scam rules
│   ├── sandboxBank.mjs           Sandbox bank scenarios and how TheBlip reacts to each
│   ├── tts.mjs                   Read-aloud text cleanup and the ElevenLabs call
│   ├── languages.mjs, translate.js   Language list, voice choice, translation of warnings
│   ├── i18n.mjs                  Interface translation helpers
│   ├── nemotron.mjs              NVIDIA Nemotron scam classifier (tolerant answer parsing)
│   ├── scamCheck.mjs             The scam decision: model on every message, rules and classifier as backup
│   ├── scamNormalize.mjs, scamNB.mjs   Removes disguises; small local classifier
│   ├── claude.js, vision.js, statement.mjs, receipt.mjs   Claude features (Claude never does the math)
│   ├── grocery.mjs               Store prices, health ratings and comparisons
│   ├── pantries.js, openNow.mjs, geo.mjs   Free food places, opening hours, distance
│   ├── orgs.js, platform.mjs, partnerApi.js, webhooks.js, analytics.mjs   Partner platform
│   ├── guard.js                  Rate limits, admin lockout, budgets
│   └── ids.js, api.js, onboarding.mjs   Student ids, request helpers, tip content
├── data/                         Scam samples, the evaluation set (scam-eval/), the shipped classifier, translatable strings
├── scripts/                      Test suites, scam evaluation, partner demo scripts
├── docs/API.md                   Partner API reference
├── docs/SCAM-EVAL.md             How well the scam check works, honestly
├── public/                       Logo, the embeddable widget script, and i18n/ (one dictionary per language)
├── .env.example                  Every setting the app reads (copy to .env.local)
└── package.json                  Scripts: dev, build, start, test, eval
```

## How it works

- The bank (or the `/bank` simulator) sends events like `autopay_enabled` to `POST /api/events`.
- `lib/engine.js` matches the event to a quest, awards points once, and updates the level.
- Student pages poll `/api/state` every 2 seconds, so they update live.
- Data lives in memory and is saved to `data/db.json` (ignored by git). It resets if the server restarts on a host with a temporary disk. That is fine for a demo.
- Scam check: fixed rules first. Only one-flag ("suspicious") messages go to Nemotron, if `NVIDIA_API_KEY` and `NEMOTRON_MODEL` are set. Without them the app works with rules only.
- Pasted messages are not stored.

API details: `docs/API.md`.

## Evaluating the scam check

On a 483-message synthetic set, the check we ship caught **100% of scams with about 8% false alarms** on the held-out test part (73 scams, 65 legitimate messages), against 74% caught for the design we started with. The confidence ranges are wide and the data is synthetic, so read `docs/SCAM-EVAL.md` before quoting a number.

```bash
npm run eval:scam     # prints the comparison from cached model answers
npm run test:scam     # unit tests for the decision logic
```

The set, the cached model answers and the scripts to rebuild everything are in `data/scam-eval/` and `scripts/`. The older 38-message check (`npm run eval`) is kept for reference.

**Recommended setting:** `NEMOTRON_MODEL=nvidia/nemotron-3-super-120b-a12b`. The lightning model was slower than our time limit on 42% of calls in our test.

## Deploy (DigitalOcean App Platform)

- Build command: `npm run build`
- Run command: `npm start`
- Environment: add the variables from `.env.example` (keep keys in the host's encrypted settings, never in the repo).

## Grocery comparison

- **Where:** the Food tab, `/groceries`. Build a list from the catalog, a starter list, or plain words.
- **Prices are computed by code, never by Claude.** Claude only reads a natural request into catalog items and writes a short summary from numbers the code already computed. If Claude is off, out of budget, or fails, a keyword matcher and plain-text advice take over.
- **Sample data.** The catalog in `lib/grocery.mjs` has about 35 staples with typical sample prices at 4 store chains and a simple 0 to 100 health rating with a reason. These are not live prices. Edit the numbers there as you collect real ones, and check `PRICE_NOTE` still tells the truth.
- **Real quest.** Comparing a basket of 5 or more items completes the grocery quest.
- **Tests:** `npm run test:grocery` checks the store math, swaps, budget trimming and the keyword parser.
- **Claude settings:** `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` (default `claude-opus-5`) and `CLAUDE_CALLS_PER_10MIN`. In DigitalOcean add the key as an encrypted variable.

## Free food map

- `/food` shows a map with a pin for each place, a list with the details, and filters (On campus, Oakland, Nearby, Open now).
- **Open now** is shown only for places with confirmed weekly hours (`schedule` in `lib/pantries.js`, Pittsburgh time). Every other place shows "Confirm before you go". Never add a `schedule` you have not confirmed with the source.
- **Use my location** sorts by distance. The location stays in the browser and is never sent to the server.
- **Coordinates** come from OpenStreetMap search. Campus buildings and one Bloomfield address are placed at the area, not the exact door, and the page says so. Map tiles and data are from OpenStreetMap contributors.
- Tests: `npm run test:map` checks the open-now logic (including time zones and daylight saving) and the distance math.

## Partner platform (for banks and other companies)

- **Console** (`/console`, Bank view): overview charts and KPIs, program settings, and an integration center. Overview is public; **Program** and **Integration** need `ADMIN_PASSWORD`.
- **Organizations.** Each partner has its own students, API keys, custom quests, points budget, brand and webhook. Nothing is shared between them. The `demo` organization is created automatically and holds the students of the public app.
- **Public API** (`/api/v1/...`, key in `Authorization: Bearer`): send events, read a student, list quests, read stats, mint embed tokens. Full docs at `/docs`. Keys are shown once and only a hash is stored.
- **Embeddable widget:** the partner's server mints a short-lived, signed, read-only token, and the page includes `<script src=".../embed.js" data-token="...">`.
- **Webhooks:** signed with HMAC-SHA256 when a student earns points. Addresses must be public https URLs; private, loopback and cloud-metadata addresses are refused, and redirects are not followed. There are no automatic retries yet.
- **Simulated cohort:** the Console can load 240 generated students so the charts have something to show. They are flagged, excluded by default, never counted by the partner API, and never trigger webhooks.
- **Reset everyone** clears students and points but keeps organizations, keys and quests.
- **Tests:** `npm test` runs the unit suites. `scripts/e2e-platform.py` runs 73 end-to-end checks (see the comment at the top of that file).
- Local testing only: `WEBHOOK_ALLOW_INSECURE=1` and `WEBHOOK_ALLOW_PRIVATE=1` let webhooks reach a local receiver. Never set them on a live server.

## Students and saved data

- **Every browser is its own student.** The app creates an id the first time someone visits and keeps it in the browser. Nobody shares progress with anyone else.
- **Link a phone to a laptop for a demo.** On the Bank simulator page you will see a link like `https://your-site/?student=s_abc123`. Open it on a phone and both devices act as the same student.
- **Reset this student** clears only your own demo student and needs no password. **Reset everyone** needs `ADMIN_PASSWORD`.
- **The bank console counts everyone** who has used the app.
- **Saving across redeploys (optional).** Set `DATABASE_URL` to any Postgres connection string. The app saves its whole state there about once a second and reloads it on start. Without it, data lives in memory and a local file and is lost when the server restarts. Use one server instance only. Set `PGSSL=disable` if your database does not use SSL.
- `MAX_STUDENTS` (default 5000) caps how many students the demo will hold.

## Protecting the live site

- **Reset needs a password on the live server.** Set `ADMIN_PASSWORD` in the host's encrypted settings. Without it, reset is disabled in production so nobody can wipe the demo. On your own computer (`npm run dev`) reset works without a password, so leave the prompt empty.
- **Rate limits.** Each visitor is limited per minute on every write action (scam check 20, events 120, redeem 30, recovery 60), and reset attempts are limited too.
- **Model quota guard.** At most `MODEL_CALLS_PER_10MIN` (default 60) model calls are made across all visitors every 10 minutes. After that the scam check keeps working with rules only.
- The bank simulator's events are open on purpose: they are how the demo works. They only change demo data.

## What could go wrong (and what we did about it)

We tried to think about how this could hurt someone, be abused, or confuse people.

| Risk | What we did |
| --- | --- |
| **The AI is wrong** about a scam or a document | We measured it (`docs/SCAM-EVAL.md`): about 100% of scams caught and about 8% false alarms on synthetic test data, with wide error ranges. Every verdict comes with reasons in plain words, and we say the result is guidance, not proof. Statement and receipt readings are shown back to the person to check and edit before anything changes. |
| **The AI makes up numbers** | Claude never computes money. All prices, totals, interest and payoff times come from code, and there are tests for them. |
| **The AI is slow, down or out of budget** | Timeouts, caching, a call budget, and fallbacks: a rules and local-classifier backup for the scam check (about 18% false alarms in our test, and the screen says the AI check did not run), keyword grocery matching, plain-text advice. |
| **Fraud and gaming the points** | Server-side daily caps, recovery rewards once a day, quiz bonus limits, per-visitor rate limits, and no points for spending or opening cards. |
| **Private data leaks** | Uploads and pasted messages are read once and not saved. The app never asks for account numbers, card numbers or passwords, and warns people not to enter them. Demo data is synthetic. |
| **Partner API abuse** | Hashed API keys, per-key and per-IP rate limits, signed webhooks, blocked private addresses (SSRF guard), admin lockout, and no real student names in partner data. |
| **Bad or outdated local info** | Pantry hours are marked "not confirmed" when we have not verified them, with the check date, and only confirmed places show open or closed. Grocery prices are labeled as samples. |
| **Confusing or inaccessible screens** | A first-visit welcome and per-page tips, plain language, keyboard and screen-reader support in dialogs, and a high-contrast light map. |
| **Someone treats it as financial advice** | Educational only. No card recommendations and no promised score changes. Not affiliated with any bank. |
| **Someone cannot read English, or uses a screen reader** | The interface and safety screens switch language, results can be read aloud, and the safety screens follow screen-reader basics (labels, landmarks, announcements). Not everything is translated yet, and we have not tested with a real screen reader. |
| **A translation is wrong or too literal** | Translations are labeled as AI-made, keep numbers and names unchanged, are rejected if they do not match the original item for item, and the English warning always stays on screen. A native speaker should review them. |
| **The voice service is down or the key runs out** | Read aloud falls back to the browser's voice, is rate limited, has a per-10-minute call budget, and caches repeats. |
| **Someone sends money to a scammer** | "Before you send money" checks a payment request for common scam patterns (gift cards, crypto, "send it back", secrecy, fake bank calls) and says what to do next, including calling the bank and reporting to the FTC. |

Known limits: the payment and scam checks catch common patterns, not every scam. Our evaluation data is synthetic and small, and we have not tested against attackers who target this system. We have not tested with a real bank's data, and the bank events in the demo are simulated.

## Guardrails

- Educational only. No card recommendations, no promised score changes.
- All payouts and gift cards are simulated. No real money moves.
- Behavior events are simulated in the demo; a real bank would send them.
- ROI numbers are editable assumptions, not PNC data.
- Not affiliated with any bank. Use our own name and colors.
