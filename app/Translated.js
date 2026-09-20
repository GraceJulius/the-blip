'use client';
import { useEffect, useState } from 'react';
import { post } from './useBlip';
import { useLang } from './lang';
import { langById } from '@/lib/languages.mjs';
import ReadAloud from './ReadAloud';

// Shows our warning in the chosen language, large and easy to read, with a Read aloud button.
// Renders nothing when the language is English.
export default function Translated({ parts }) {
  const lang = useLang();
  const key = lang + '|' + JSON.stringify(parts);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (lang === 'en') { setOut(null); setErr(''); return; }
    let live = true;
    setOut(null); setErr('');
    post('/api/translate', { texts: parts, lang }).then((r) => {
      if (!live) return;
      if (r.texts) setOut(r.texts); else setErr('Translation is not available right now. The warning above is still correct.');
    }).catch(() => live && setErr('Translation is not available right now. The warning above is still correct.'));
    return () => { live = false; };
  }, [key]);

  if (lang === 'en') return null;
  const l = langById(lang);
  return (
    <div className="card" style={{ marginTop: 12 }} lang={lang} aria-live="polite">
      <h2>{l.native}</h2>
      {!out && !err && <p className="note">Translating…</p>}
      {err && <p className="note">{err}</p>}
      {out && (
        <>
          {out.map((t, i) => <p key={i} style={{ fontSize: 18, lineHeight: 1.5, margin: i === 0 ? '0 0 8px' : '0 0 6px', fontWeight: i === 0 ? 700 : 400 }}>{t}</p>)}
          <p style={{ margin: '10px 0 4px' }}><ReadAloud text={out.join(' ')} lang={lang} label={l.id === 'yo' ? 'Read aloud (experimental voice)' : 'Read aloud'} /></p>
          <p className="note">Translated by AI. If it matters, check it with someone you trust.{l.voice === null ? ' There is no voice for this language yet, so this device may read it with a different accent.' : ''}</p>
        </>
      )}
    </div>
  );
}
