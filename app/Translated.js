'use client';
import { useEffect, useState } from 'react';
import { post } from './useBlip';
import { useLang } from './lang';
import { langById } from '@/lib/languages.mjs';
import ReadAloud from './ReadAloud';
import { useT } from './i18n';

// Shows our warning in the chosen language, large and easy to read, with a Read aloud button.
// Renders nothing when the language is English.
export default function Translated({ parts }) {
  const lang = useLang();
  const t = useT();
  const key = lang + '|' + JSON.stringify(parts);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (lang === 'en') { setOut(null); setErr(''); return; }
    let live = true;
    setOut(null); setErr('');
    post('/api/translate', { texts: parts, lang }).then((r) => {
      if (!live) return;
      if (r.texts) setOut(r.texts); else setErr(t('Translation is not available right now. The warning above is still correct.'));
    }).catch(() => live && setErr(t('Translation is not available right now. The warning above is still correct.')));
    return () => { live = false; };
  }, [key]);

  if (lang === 'en') return null;
  const l = langById(lang);
  return (
    <div className="card" style={{ margin: '12px 0' }} lang={lang} aria-live="polite">
      <h2>{l.native}</h2>
      {!out && !err && <p className="note" role="status">{t('Translating…')}</p>}
      {err && <p className="note">{err}</p>}
      {out && (
        <>
          {out.map((line, i) => <p key={i} style={{ fontSize: 18, lineHeight: 1.5, margin: i === 0 ? '0 0 8px' : '0 0 6px', fontWeight: i === 0 ? 700 : 400 }}>{line}</p>)}
          {l.voice !== null && <p style={{ margin: '10px 0 4px' }}><ReadAloud text={out.join(' ')} lang={lang} label={t('Read aloud')} /></p>}
          <p className="note">{t('Translated by AI. If it matters, check it with someone you trust.')}{l.voice === null ? ' ' + t('This language is text only for now, with no voice yet.') : ''}</p>
        </>
      )}
    </div>
  );
}
