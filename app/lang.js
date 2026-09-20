'use client';
import { useEffect, useState } from 'react';
import { LANGS, isLang } from '@/lib/languages.mjs';

const KEY = 'blipLang';

function read() {
  try { const v = localStorage.getItem(KEY); return isLang(v) ? v : 'en'; } catch { return 'en'; }
}

// The chosen language for warnings and read-aloud. Stored in this browser only.
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

export function LangSelect({ label = 'Language for warnings' }) {
  const lang = useLang();
  function change(e) {
    try { localStorage.setItem(KEY, e.target.value); } catch {}
    window.dispatchEvent(new Event('blip-lang'));
  }
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="note">{label}</span>
      <select value={lang} onChange={change} aria-label={label}>
        {LANGS.map((l) => <option key={l.id} value={l.id}>{l.native}{l.id !== 'en' ? ' (' + l.name + ')' : ''}</option>)}
      </select>
    </label>
  );
}
