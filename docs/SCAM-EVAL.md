# How well does the scam check work?

This is an honest evaluation of the scam check on a 483-message synthetic test set. It compares the design we started with, several alternatives, and the design we shipped. Every number can be reproduced with the commands at the bottom.

## Summary

| Design | Scams caught | False alarms |
| --- | --- | --- |
| Keyword rules only | 74% | 25% |
| **What we started with:** rules, then the model only if exactly one rule fires | **74%** | 6% |
| **What we ship:** the Nemotron model checks every message, rules and a local classifier explain and back it up | **100%** | 8% |
| Backup mode (model unavailable): rules and local classifier only | 100% | 18% |

Numbers are on the held-out **test** part (73 scams, 65 legitimate messages). 95% confidence ranges are wide: scams caught 95 to 100% for the shipped design; false alarms 3 to 17%.

What the evaluation changed in the product:

1. **The old design missed about a quarter of scams**, including 27% of disguised ones and 42% of non-English ones. A message with no rule flag was never shown to the model, so those slipped through as "no red flags."
2. **The model now checks every message.** It was the most accurate single signal by a wide margin. The rules and classifier no longer decide alone, because on their own they cried wolf too often.
3. **The model we were using was too slow.** `nemotron-3.5-lightning-30b-a3b` took longer than our 12 second limit on 16 of 38 calls (42%), so the app silently fell back to rules almost half the time. `nemotron-3-super-120b-a12b` had a median of about 1 second and exceeded the limit on 1 of 38. **Set `NEMOTRON_MODEL=nvidia/nemotron-3-super-120b-a12b`.**
4. **A parsing bug.** The model sometimes returns almost-valid JSON (an unquoted explanation), and the old parser threw the whole answer away. It now recovers the label and explanation.
5. **Disguises are removed first** (lookalike letters, hidden characters, spaced-out words, defanged links, decorative emoji), so the same rules see plain text.
6. **The app says when the AI check did not run.** If the model is slow, rate limited or out of budget, the screen shows "The AI double-check was not available, so this is a first-pass check only."

## The data

483 synthetic messages, generated with Claude and checked for duplicates. Everything is invented: made-up domains, made-up numbers, no working links.

- **Scams (257):** 21 kinds, including toll and parking fines, package fees, fake bank calls, refund and overpayment tricks, fake jobs, fake rentals, hacked-friend requests, prizes, crypto, tech support, loan forgiveness, scholarship fees, government threats, payment-app traps, gift-card requests, QR codes, fake invoices, romance-investment chats and "easy task" jobs.
- **Legitimate (226):** 16 kinds, including genuine bank alerts, one-time codes, delivery updates, university and landlord messages, friends splitting bills, receipts, password resets, renewals, employer schedules, family check-ins and store promotions. Many are **hard negatives** that mention money, links, urgency or codes for good reasons.
- **Non-English (80):** Spanish, French, Portuguese, Yoruba, Hausa, Hindi, Swahili and Arabic, scam and legitimate.
- **Disguised copies (75):** scams (and a few legitimate messages) with typos, number-for-letter swaps, lookalike Cyrillic letters, hidden zero-width characters, spaced-out words, defanged links, all caps or emoji.

**Split.** 345 messages are "dev" (used for choosing settings) and 138 are "test" (used once, at the end). A disguised copy always lands in the same split as its original, so the test cannot leak.

## Results

Confidence ranges are 95% Wilson intervals. "Cost" counts a missed scam as 8 false alarms.

### Test (scored once)

| Design | Scams caught | False alarms | Precision | F1 | Model calls |
| --- | --- | --- | --- | --- | --- |
| Rules, as is | 74.0% (63-83) | 24.6% (16-36) | 77% | 0.76 | 0% |
| Rules after removing disguises | 75.3% (64-84) | 24.6% (16-36) | 78% | 0.76 | 0% |
| Local classifier alone | 100% (95-100) | 33.8% (24-46) | 77% | 0.87 | 0% |
| **Started with:** rules, then Nemotron if one flag | 74.0% (63-83) | 6.2% (2-15) | 93% | 0.82 | 35% |
| Nemotron super on every message | 100% (95-100) | 7.7% (3-17) | 94% | 0.97 | 100% |
| **Shipped:** model on every message, rules and classifier as backup | 100% (95-100) | 7.7% (3-17) | 94% | 0.97 | 100% |
| Backup only (model unavailable) | 100% (95-100) | 18.5% (11-30) | 86% | 0.92 | 0% |

### Where the shipped design does well and badly (test)

| Group | Started with | Shipped |
| --- | --- | --- |
| All scams | caught 54 of 73 | caught 73 of 73 |
| Disguised scams | 8 of 11 | 11 of 11 |
| Non-English scams | 7 of 12 | 12 of 12 |
| Hard scams | 19 of 28 | 28 of 28 |
| False alarms, all legitimate | 4 of 65 | 5 of 65 |
| False alarms, hard legitimate | 2 of 18 | 3 of 18 |
| False alarms, non-English legitimate | 0 of 13 | 2 of 13 |

The shipped design gave 5 false alarms on the test set: a family message about a relative's surgery, a payment notice with typos, a store sale text, a Yoruba bank alert and a Hausa message from a mother about sending money. A genuine notice that mentions money or an account, or a casual message that sounds like "a friend asking for help", is the hardest thing for it.

### Dev

On dev the shipped design caught 98.4% of scams (95-99) with 5.6% false alarms (3-10). Other designs we tried and did not ship:

- **A cascade** that only asks the model about unsettled messages (fewer model calls). It caught 100% but doubled the false alarms (15% on test). 7 of its 10 test false alarms came from the cheap signals warning without asking the model.
- **Letting the rules or classifier clear or override the model.** Changed at most one test message, so it was not worth the added logic.

## How the shipped design works

1. Rules (on the message with disguises removed) and a small local classifier run first. The classifier is a Naive Bayes model on character patterns, 8,000 weights, about 100 KB. It works on other languages and misspelled text because it looks at letter patterns.
2. The Nemotron model reads the message. Its answer decides the level: scam is "likely scam," legit is "probably fine" (or "no red flags"), unsure is "suspicious."
3. When the model says scam but no rule fired, the screen shows "Wording similar to scam messages we have seen," so the verdict always has a reason.
4. If the model gives no answer, the classifier's warning threshold takes over. That threshold was chosen on dev only, to keep false alarms at or under 15% while catching as much as possible. The screen says the check was first-pass only.

## Limits: read these before quoting a number

- **The data is synthetic**, written by an AI. Real scam messages are messier and more varied, and real false alarms will probably be higher. Treat these numbers as a comparison between designs on one set, not a promise about the real world.
- **The test set is small** (138 messages). The confidence ranges are wide, and small differences between designs are within noise. The large gaps (74% vs 100% caught) are not.
- **Non-English coverage is thin** (25 test messages) and generated by an AI in languages where it is less reliable, especially Yoruba and Hausa. False alarms on non-English legitimate messages (2 of 13) deserve a closer look.
- **The shipped classifier is trained on all 483 messages**, including the test part, because that is the version that ships. The test numbers come from the version trained on dev only. The shipped classifier has not been measured on held-out data.
- **The model is an outside service.** Its answers can change when the provider updates it, and it can be slow or rate limited. We cached the answers used here, and the app has a backup for when it is unavailable.
- **The message text is sent to the model provider** (NVIDIA) for each check. The app says it does not store the message, and it does not, but a real deployment would need a privacy review and an agreement with the provider.
- **We have not tested against adaptive attackers**, who write messages to defeat this specific system, and we have not tested on real student messages.

## Reproduce

```bash
node scripts/gen-scam-set.mjs                 # generate the messages (needs ANTHROPIC_API_KEY)
node scripts/build-scam-set.mjs               # add disguised copies, split into dev and test
node scripts/run-model-eval.mjs nvidia/nemotron-3-super-120b-a12b   # cache the model's answers (needs NVIDIA_API_KEY)
node scripts/eval-scam-v2.mjs                 # print the tables above
node scripts/train-scam-nb.mjs                # train the shipped classifier into data/scam-nb.json
npm run test:scam                             # unit tests for the decision logic
```

The model runner is rate limit aware (about 2 seconds between requests, retrying when the provider says slow down). Running two models at once produced HTTP 429 errors and lost answers in our first attempt, which is why it now runs one request at a time.
