export const LEVELS = [
  { name: 'Rookie', xp: 0 },
  { name: 'Watcher', xp: 150 },
  { name: 'Guardian', xp: 400 },
  { name: 'Sentinel', xp: 800 },
  { name: 'Blip Master', xp: 1400 },
];

export function levelFor(xp) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) index = i;
  const cur = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100;
  return { index, name: cur.name, nextName: next ? next.name : null, nextXp: next ? next.xp : null, progress };
}
