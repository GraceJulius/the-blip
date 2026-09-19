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
| `app/scam`, `lib/scamRules.mjs`, `lib/nemotron.js`, `data/scam-samples.json`, `scripts/eval-scam.mjs` | Scam check, model, evaluation | Data and AI |
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

## Guardrails

- Educational only. No card recommendations, no promised score changes.
- All payouts and gift cards are simulated. No real money moves.
- Behavior events are simulated in the demo; a real bank would send them.
- ROI numbers are editable assumptions, not PNC data.
- Not affiliated with any bank. Use our own name and colors.
