'use client';
import { useEffect, useState } from 'react';
import { isLang } from '@/lib/languages.mjs';

export const LANG_KEY = 'blipLang';

function read() {
  try {
    // A link like /scam?lang=yo picks the language and remembers it.
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isLang(fromUrl)) { localStorage.setItem(LANG_KEY, fromUrl); return fromUrl; }
    const v = localStorage.getItem(LANG_KEY);
    return isLang(v) ? v : 'en';
  } catch { return 'en'; }
}

// The chosen language for the app, warnings and read-aloud. Stored in this browser only.
export function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    setLang(read());
    const on = () => setLang(read());
    window.addEventListener('blip-lang', on);
    return () => window.removeEventListener('blip-lang', on);
  }, []);
  return lang;
}
