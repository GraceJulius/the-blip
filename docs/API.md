# TheBlip API

All routes are JSON. `studentId` defaults to `s1` (the demo student).

## POST /api/events
Bank reports a student action.
```json
{ "studentId": "s1", "type": "autopay_enabled" }
```
Returns `{ awarded, questId, blocked, message, state }`. `blocked: true` means the student is in recovery mode and quest events are paused.

Event types: `autopay_enabled`, `payment_on_time`, `utilization_under_30`, `payoff_plan_written`, `emergency_fund_started`, `credit_report_checked`, `basket_compared`, `scam_reported`, `card_frozen`.

## GET /api/state?studentId=s1
Points, XP, level, quests with `done` flags, lock and recovery state, recent ledger.

## POST /api/redeem
Spends 300 points on a demo gift card. Returns `{ ok, code }` or `{ ok: false, error }`.

## POST /api/scam-check
```json
{ "message": "text to check", "report": false }
```
Returns `{ level, flags, model }` where `level` is `likely_scam`, `suspicious`, or `no_flags`. With `"report": true` and a flagged message, awards points (25, max 5 per day).

## POST /api/recovery
- `{ "action": "start", "description": "I clicked a link" }` locks quests, awards 25 points for reporting.
- `{ "action": "step", "stepId": "change_passwords" }` marks a step done.
- `{ "action": "quiz", "answers": [1,1,1] }` scores the quiz. Pass is 2 of 3. Failing costs no points.
Recovery completes (unlocks, +100 points) when all steps are done and the quiz is passed. The `card_frozen` event completes the freeze step.

## GET /api/stats?enrolled=5000&avoided=4
Live counts plus a projection with editable assumptions.

## POST /api/reset
Clears demo data.
