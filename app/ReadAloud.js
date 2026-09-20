'use client';
import { useEffect, useRef, useState } from 'react';

// "Read aloud" button. Tries the ElevenLabs voice through /api/tts, and falls back to the browser's voice.
export default function ReadAloud({ text, label = 'Read aloud' }) {
  const [state, setState] = useState('idle');
  const audio = useRef(null);
  const url = useRef('');

  function stop() {
    if (audio.current) { audio.current.pause(); audio.current = null; }
    if (url.current) { URL.revokeObjectURL(url.current); url.current = ''; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
    setState('idle');
  }
  useEffect(() => stop, []);

  async function speak() {
    if (state !== 'idle') { stop(); return; }
    setState('loading');
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (res.ok && (res.headers.get('content-type') || '').includes('audio')) {
        url.current = URL.createObjectURL(await res.blob());
        const a = new Audio(url.current);
        audio.current = a;
        a.onended = stop;
        a.onerror = stop;
        await a.play();
        setState('playing');
        return;
      }
    } catch {}
    try {
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 700));
      u.onend = () => setState('idle');
      u.onerror = () => setState('idle');
      window.speechSynthesis.speak(u);
      setState('playing');
    } catch { setState('idle'); }
  }

  return (
    <button type="button" className="ghost small" onClick={speak} aria-label={state === 'idle' ? label : 'Stop reading'}>
      {state === 'loading' ? 'Loading…' : state === 'playing' ? 'Stop' : label}
    </button>
  );
}
