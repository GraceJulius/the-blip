'use client';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'blipStudent';
const OK = /^[A-Za-z0-9_-]{1,40}$/;

function randomId() {
  return 's_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export function studentId() {
  if (typeof window === 'undefined') return 's1';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('student');
    if (fromUrl && OK.test(fromUrl)) {
      localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    let id = localStorage.getItem(KEY);
    if (!id || !OK.test(id)) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    window.__blipStudent = window.__blipStudent || randomId();
    return window.__blipStudent;
  }
}

export async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: studentId(), ...(body || {}) }) });
  return res.json();
}

export function useBlip() {
  const [state, setState] = useState(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state?studentId=' + studentId(), { cache: 'no-store' });
      if (res.ok) setState(await res.json());
    } catch {}
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);
  return { state, refresh };
}
