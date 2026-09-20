import { checkRules } from './scamRules.mjs';
import { deobfuscate } from './scamNormalize.mjs';
import { score } from './scamNB.mjs';

// The scam check. What the evaluation (docs/SCAM-EVAL.md) supports:
//   - The Nemotron model looks at every message. It was the most accurate single signal by a wide margin.
//   - Plain-language rules (on the message with disguises removed) and a small local classifier run alongside it.
//     They explain the verdict, and they are the backup when the model is slow, rate limited or out of budget.
//   - Cheap signals alone are not trusted to raise a "likely scam" alarm, because on their own they cried wolf too often.
// Returns the levels the app already shows: likely_scam, suspicious, probably_fine, no_flags.

export const PATTERN_FLAG = { id: 'pattern', label: 'Wording similar to scam messages we have seen' };

// Union of what the rules see in the original text and in the cleaned-up text.
export function rulesFlags(text) {
  const seen = new Set();
  const out = [];
  for (const f of [...checkRules(text).flags, ...checkRules(deobfuscate(text)).flags]) if (!seen.has(f.id)) { seen.add(f.id); out.push(f); }
  return out;
}

export const DEFAULT_PARAMS = { warn: 4.7 };

// askModel(text) -> { label, explanation } or null. Pass a function that returns null when no model is allowed.
export async function decide(text, { nbModel, askModel, params } = {}) {
  if (!text || !String(text).trim()) return { level: 'no_flags', flags: [], model: null, via: 'empty', score: 0, verified: true };
  const p = { ...DEFAULT_PARAMS, ...(params || (nbModel && nbModel.params) || {}) };
  const flags = rulesFlags(text);
  const s = nbModel ? score(nbModel, text) : 0;
  const looksLikeScam = Boolean(nbModel) && s >= p.warn;
  const withPattern = () => (flags.length ? flags : [PATTERN_FLAG]);

  const model = askModel ? await askModel(text) : null;
  if (model && model.label === 'scam') return { level: 'likely_scam', flags: withPattern(), model, via: 'model', score: s, verified: true };
  if (model && model.label === 'legit') return { level: flags.length ? 'probably_fine' : 'no_flags', flags, model, via: 'model', score: s, verified: true };
  if (model) return { level: 'suspicious', flags: withPattern(), model, via: 'model', score: s, verified: true };   // unsure

  // Backup: the model gave no answer. The classifier's threshold was picked on the development data to keep false alarms low.
  if (looksLikeScam) return { level: flags.length >= 2 ? 'likely_scam' : 'suspicious', flags: withPattern(), model: null, via: 'backup', score: s, verified: false };
  if (!nbModel && flags.length >= 2) return { level: 'likely_scam', flags, model: null, via: 'backup', score: s, verified: false };
  if (!nbModel && flags.length === 1) return { level: 'suspicious', flags, model: null, via: 'backup', score: s, verified: false };
  return { level: 'no_flags', flags: [], model: null, via: 'backup', score: s, verified: false };
}
