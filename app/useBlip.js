'use client';
import { useCallback, useEffect, useState } from 'react';

export const STUDENT = 's1';

export async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: STUDENT, ...(body || {}) }) });
  return res.json();
}

export function useBlip() {
  const [state, setState] = useState(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state?studentId=' + STUDENT, { cache: 'no-store' });
      setState(await res.json());
    } catch {}
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);
  return { state, refresh };
}
