const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nyParts(now) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { day: DAY_NAMES.indexOf(p.weekday), minutes: Number(p.hour) * 60 + Number(p.minute) };
}

function label(h) {
  const hour = h % 12 === 0 ? 12 : h % 12;
  return hour + (h >= 12 && h < 24 ? ' PM' : ' AM');
}

// schedule: { 1: [[11, 14]], 2: [[11, 19]] }  (0 = Sunday, hours are 24h, Pittsburgh time)
export function openStatus(schedule, now = new Date()) {
  if (!schedule) return null;
  const { day, minutes } = nyParts(now);
  const today = schedule[day] || [];
  for (const [a, b] of today) {
    if (minutes >= a * 60 && minutes < b * 60) return { open: true, text: 'Open now until ' + label(b) };
  }
  for (const [a] of today) {
    if (minutes < a * 60) return { open: false, text: 'Closed now, opens today at ' + label(a) };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const s = schedule[d];
    if (s && s.length) return { open: false, text: 'Closed now, opens ' + (i === 1 ? 'tomorrow' : DAY_NAMES[d]) + ' at ' + label(s[0][0]) };
  }
  return { open: false, text: 'Closed now' };
}
