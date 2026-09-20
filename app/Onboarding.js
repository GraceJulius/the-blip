'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './Icons';
import { useT } from './i18n';
import { STORAGE_KEY, WELCOME, INTROS, pickTip, introFor, readStore } from '@/lib/onboarding.mjs';

function load() {
  try { return readStore(localStorage.getItem(STORAGE_KEY)); } catch { return { seen: {}, tipsOff: false }; }
}
function save(v) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch {}
}

export default function Onboarding() {
  const t = useT();
  const path = usePathname() || '/';
  const [tip, setTip] = useState(null);
  const [step, setStep] = useState(0);
  const box = useRef(null);
  const opener = useRef(null);

  const show = useCallback((id, from) => { opener.current = from || document.activeElement; setStep(0); setTip(id); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { seen, tipsOff } = load();
      const next = pickTip(path, seen, tipsOff);
      if (next) show(next);
    }, 600);
    return () => clearTimeout(timer);
  }, [path, show]);

  useEffect(() => {
    const onHelp = (e) => show(path === '/' ? 'welcome' : introFor(path) ? introFor(path).id : 'welcome', e && e.detail && e.detail.opener);
    window.addEventListener('blip-help', onHelp);
    return () => window.removeEventListener('blip-help', onHelp);
  }, [path, show]);

  const close = useCallback((turnOff) => {
    const v = load();
    if (tip) v.seen[tip] = true;
    if (turnOff) v.tipsOff = true;
    save(v);
    setTip(null);
    if (opener.current && opener.current.focus) { try { opener.current.focus(); } catch {} }
  }, [tip]);

  useEffect(() => {
    if (!tip) return;
    const primary = box.current && box.current.querySelector('[data-primary]');
    if (primary) primary.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const f = [...box.current.querySelectorAll('button, a[href]')].filter((x) => !x.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [tip, step, close]);

  if (!tip) return null;
  const welcome = tip === 'welcome';
  const data = welcome ? WELCOME[step] : INTROS[tip];
  if (!data) return null;
  const last = !welcome || step === WELCOME.length - 1;

  return (
    <div className="ob-back">
      <div className="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title" ref={box}>
        <div className="ob-ico"><Icon name={data.icon} size={26} /></div>
        <h2 id="ob-title">{t(data.title)}</h2>
        {data.lead && <p className="ob-lead">{t(data.lead)}</p>}
        {data.body && <p className="ob-lead">{t(data.body)}</p>}
        {data.list && <ul className="ob-list">{data.list.map((x) => <li key={x}><Icon name="check" size={16} /><span>{t(x)}</span></li>)}</ul>}
        {data.note && <p className="note" style={{ margin: '10px 0 0' }}>{t(data.note)}</p>}
        {welcome && <div className="ob-dots" aria-hidden="true">{WELCOME.map((_, i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>}
        <div className="ob-actions">
          {welcome && step > 0 && <button className="ghost" onClick={() => setStep(step - 1)}>{t('Back')}</button>}
          <button data-primary onClick={() => (last ? close(false) : setStep(step + 1))}>{last ? (welcome ? t('Get started') : t('Got it')) : t('Next')}</button>
        </div>
        <div className="ob-foot">
          {welcome && !last && <button className="linkish" onClick={() => close(false)}>{t('Skip')}</button>}
          <button className="linkish" onClick={() => close(true)}>{t('Do not show tips again')}</button>
        </div>
      </div>
    </div>
  );
}
