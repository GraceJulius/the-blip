<p align="center"><img src="public/logo.png" alt="TheBlip logo" width="220"></p>

# TheBlip

See the real cost before you swipe. TheBlip helps college students make better credit decisions, spot scams, and level up by building safe money habits. Banks plug it in through a small event API.

> Every card pays you to spend. We pay you to not get hurt.

Built for SteelHacks XIII. Full plan and build guide: see the team's shared doc (link in the team chat) and `docs/`.

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

## What is in the box

| Path | What | Suggested owner |
| --- | --- | --- |
| `app/check` | Reward reality check and payoff plan | Frontend A |
| `app/page.js`, `app/Nav.js`, `app/globals.css` | Dashboard, nav, styling | Frontend A |
| `app/quests`, `app/bank`, `app/recovery` | Quests, bank simulator, recovery mode | Frontend B |
| `app/scam`, `lib/scamRules.mjs`, `lib/nemotron.mjs`, `data/scam-samples.json`, `scripts/eval-scam.mjs` | Scam check, model, evaluation | Data and AI |
| `app/console`, `app/api/stats` | Bank console | Pitch and console |
| `app/api/*`, `lib/engine.js`, `lib/quests.js`, `lib/levels.js`, `lib/store.js` | API, points engine, data | Lead and API |

## How it works

- The bank (or the `/bank` simulator) sends events like `autopay_enabled` to `POST /api/events`.
- `lib/engine.js` matches the event to a quest, awards points once, and updates the level.
- Student pages poll `/api/state` every 2 seconds, so they update live.
- Data lives in memory and is saved to `data/db.json` (ignored by git). It resets if the server restarts on a host with a temporary disk. That is fine for a demo.
- Scam check: fixed rules first. Only one-flag ("suspicious") messages go to Nemotron, if `NVIDIA_API_KEY` and `NEMOTRON_MODEL` are set. Without them the app works with rules only.
- Pasted messages are not stored.

API details: `docs/API.md`.

## Evaluating the scam check

```bash
npm run eval
```

Runs the fixed rules on every message in `data/scam-samples.json` and prints accuracy, scams caught, false alarms and misses. If `NVIDIA_API_KEY` and `NEMOTRON_MODEL` are set in `.env.local`, it also runs Nemotron on the one-flag ("suspicious") messages, exactly like the app, and shows what the model adds.

Options:

```bash
npm run eval -- --models nvidia/nemotron-3.5-lightning-30b-a3b,nvidia/nemotron-3-super-120b-a12b
npm run eval -- --all        # also test the model on every message, alone
npm run eval -- --delay 3000 # wait longer between calls if you hit rate limits
```

Results are saved to `data/eval-results.json`. Check the exact model names on build.nvidia.com.

The starter samples in `data/scam-samples.json` are synthetic and easy. Add at least 30 realistic ones, including tricky legit messages, before you quote any accuracy number.

## Team git workflow

1. `git pull` before you start.
2. Work on a branch: `git checkout -b yourname/short-topic`.
3. Commit small and often: `git add -A && git commit -m "Add payoff plan"`.
4. Push: `git push -u origin yourname/short-topic`.
5. Open a pull request. The Lead merges. Never push straight to `main` after hour 3.
6. Stuck on a merge conflict? Stop and ask the Lead.

## Deploy (DigitalOcean App Platform)

- Build command: `npm run build`
- Run command: `npm start`
- Environment: add the variables from `.env.example` if using Nemotron.

## Protecting the live site

- **Reset needs a password on the live server.** Set `ADMIN_PASSWORD` in DigitalOcean (mark it encrypted). Without it, reset is disabled in production so nobody can wipe your demo. On your own computer (`npm run dev`) reset works without a password, so leave the prompt empty.
- **Rate limits.** Each visitor is limited per minute on every write action (scam check 20, events 120, redeem 30, recovery 60), and reset attempts are limited too.
- **Model quota guard.** At most `MODEL_CALLS_PER_10MIN` (default 60) model calls are made across all visitors every 10 minutes. After that the scam check keeps working with rules only.
- The bank simulator's events are left open on purpose: they are how the demo works. Do not share the link publicly before you present.

## Guardrails

- Educational only. No card recommendations, no promised score changes.
- All payouts and gift cards are simulated. No real money moves.
- Behavior events are simulated in the demo; a real bank would send them.
- ROI numbers are editable assumptions, not PNC data.
- Not affiliated with any bank. Use our own name and colors.
