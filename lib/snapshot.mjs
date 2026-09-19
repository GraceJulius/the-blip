export function createSaver(save, delayMs = 1000) {
  let timer = null;
  let dirty = false;
  let inFlight = false;

  async function flush() {
    if (inFlight) {
      dirty = true;
      return;
    }
    inFlight = true;
    dirty = false;
    try {
      await save();
    } catch (e) {
      console.error('snapshot save failed:', e && e.message);
    }
    inFlight = false;
    if (dirty) schedule();
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, delayMs);
  }

  return { schedule, flush };
}
