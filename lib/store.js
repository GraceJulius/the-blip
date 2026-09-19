import fs from 'fs';
import path from 'path';
import { createSaver } from './snapshot.mjs';
import { loadSnapshot, saveSnapshot } from './pgStore.mjs';

const FILE = path.join(process.cwd(), 'data', 'db.json');
const useDb = () => Boolean(process.env.DATABASE_URL);

function fresh() {
  return { students: {}, ledger: [], events: [], redemptions: [], prices: {}, orgs: {}, scamSignals: [], webhookLog: [] };
}

function normalize(s) {
  const f = fresh();
  return { ...f, ...(s || {}), students: (s && s.students) || {}, ledger: (s && s.ledger) || [], events: (s && s.events) || [], redemptions: (s && s.redemptions) || [], prices: (s && s.prices) || {}, orgs: (s && s.orgs) || {}, scamSignals: (s && s.scamSignals) || [], webhookLog: (s && s.webhookLog) || [] };
}

const saver = (globalThis.__blipSaver = globalThis.__blipSaver || createSaver(() => saveSnapshot(globalThis.__blip), 1000));

let readyPromise = globalThis.__blipReady;
export function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      if (useDb()) {
        try {
          const snap = await loadSnapshot();
          if (snap) globalThis.__blip = normalize(snap);
        } catch (e) {
          console.error('Could not load saved state from the database, using local state:', e && e.message);
        }
      }
      return true;
    })();
    globalThis.__blipReady = readyPromise;
  }
  return readyPromise;
}

export function db() {
  if (!globalThis.__blip) {
    try {
      globalThis.__blip = normalize(JSON.parse(fs.readFileSync(FILE, 'utf8')));
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
  if (useDb()) saver.schedule();
}

export function reset() {
  const orgs = (globalThis.__blip && globalThis.__blip.orgs) || {};
  globalThis.__blip = { ...fresh(), orgs };
  persist();
}
