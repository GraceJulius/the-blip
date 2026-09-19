export const RULES = [
  { id: 'link', label: 'Link to an unfamiliar or lookalike site', re: /https?:\/\/\S+|\b[a-z0-9-]+\.(top|xyz|info|click|site|online|icu|cyou)\b|\b(secure|refund|pay|toll)[a-z0-9-]*\.(com|net|org)\b/i },
  { id: 'urgency', label: 'Pressure to act fast', re: /\bnow\b|immediately|within \d+ hours|final notice|overdue|urgent|last chance/i },
  { id: 'threat', label: 'Threat if you do not respond', re: /\bfine\b|suspend|locked|arrest|penalty|legal action|closed/i },
  { id: 'money', label: 'Unexpected money or prize offer', re: /refund|you are owed|you won|prize|reward waiting/i },
  { id: 'private', label: 'Asks for private details', re: /card number|password|\bssn\b|social security|confirm your|verify your|one-time code|\bcvv\b/i },
];

export const LEVEL_TEXT = {
  likely_scam: 'Likely scam',
  suspicious: 'Suspicious',
  no_flags: 'No red flags found',
};

export function checkRules(text) {
  const flags = RULES.filter((r) => r.re.test(text)).map((r) => ({ id: r.id, label: r.label }));
  const level = flags.length >= 2 ? 'likely_scam' : flags.length === 1 ? 'suspicious' : 'no_flags';
  return { level, flags };
}
