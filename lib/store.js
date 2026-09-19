import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'db.json');

function fresh() {
  return { students: {}, ledger: [], events: [], redemptions: [] };
}

export function db() {
  if (!globalThis.__blip) {
    try {
      globalThis.__blip = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
      globalThis.__blip = fresh();
    }
  }
  return globalThis.__blip;
}

export function persist() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(globalThis.__blip, null, 2));
  } catch {}
}

export function reset() {
  globalThis.__blip = fresh();
  persist();
}
