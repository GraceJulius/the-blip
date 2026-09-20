'use client';
import { useEffect, useState } from 'react';
import { useLang } from './useLang';
import { makeT } from '@/lib/i18n.mjs';
import { isRtl } from '@/lib/languages.mjs';

const dicts = new Map();
const loading = new Map();

function load(lang) {
  if (!loading.has(lang)) {
    loading.set(lang, fetch('/i18n/' + lang + '.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((d) => { dicts.set(lang, d); return d; }));
  }
  return loading.get(lang);
}

// t('English text', { vars }) in the chosen language. Falls back to English when a string is missing.
export function useT() {
  const lang = useLang();
  const [, bump] = useState(0);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
    if (lang === 'en' || dicts.has(lang)) return;
    let live = true;
    load(lang).then(() => live && bump((n) => n + 1));
    return () => { live = false; };
  }, [lang]);
  return makeT(lang === 'en' ? null : dicts.get(lang));
}
