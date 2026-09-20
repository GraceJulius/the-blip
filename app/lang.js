'use client';
import { LANGS } from '@/lib/languages.mjs';
import { useLang, LANG_KEY } from './useLang';
import { useT } from './i18n';
import Icon from './Icons';

export { useLang };

export function LangSelect({ label, compact = false, narrow = false }) {
  const lang = useLang();
  const t = useT();
  const text = label || t('Language');
  function change(e) {
    try { localStorage.setItem(LANG_KEY, e.target.value); } catch {}
    window.dispatchEvent(new Event('blip-lang'));
  }
  return (
    <label style={{ display: compact ? 'flex' : 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
      {compact ? (narrow ? null : <Icon name="globe" size={18} />) : <span className="note">{text}</span>}
      <select value={lang} onChange={change} aria-label={text} style={{ minWidth: 0, maxWidth: narrow ? 'min(92px, 24vw)' : '100%', flex: compact && !narrow ? 1 : undefined, textOverflow: 'ellipsis' }}>
        {LANGS.map((l) => <option key={l.id} value={l.id} lang={l.id}>{l.native}{l.id !== 'en' ? ' (' + l.name + ')' : ''}</option>)}
      </select>
    </label>
  );
}
