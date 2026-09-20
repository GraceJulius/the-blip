'use client';
import { useState } from 'react';
import { useBlip, post } from '../useBlip';
import { useT } from '../i18n';
import { T } from '@/lib/i18n.mjs';

const STEPS = [
  { id: 'freeze_card', title: T('Freeze the card'), hint: T('In the real product the bank confirms this automatically (use the Bank simulator).') },
  { id: 'change_passwords', title: T('Change passwords for accounts you use'), hint: T('Start with email and banking.') },
  { id: 'report', title: T('Report it to your bank and to reportfraud.ftc.gov'), hint: T('Reporting helps other students too.') },
];
const QUIZ = [
  { q: T('You clicked a scam link but entered nothing. Best first move?'), o: [T('Ignore it'), T('Change passwords and watch for odd activity'), T('Reply to the sender')] },
  { q: T('Someone claiming to be your bank asks for a code they just texted you. You:'), o: [T('Read the code'), T('Hang up and call the number on your card'), T('Text the code back')] },
  { q: T('Who should hear about a card scam first?'), o: [T('Nobody'), T('Your bank'), T('The sender')] },
];

export default function Recovery() {
  const t = useT();
  const { state, refresh } = useBlip();
  const [desc, setDesc] = useState('');
  const [answers, setAnswers] = useState([]);
  const [msg, setMsg] = useState('');
  if (!state) return <p role="status">{t('Loading…')}</p>;

  async function act(body) {
    const r = await post('/api/recovery', body);
    if (r.error) setMsg(r.error);
    if (r.score !== undefined) setMsg(r.passed ? t('Quiz passed.') : t('You got {score}/{total}.', { score: r.score, total: r.total }) + ' ' + r.note);
    refresh();
  }

  if (!state.locked) {
    return (
      <>
        <h1>{t('I think I got scammed')}</h1>
        <p className="sub">{t('No shame. Reporting earns points, and we walk you through what to do.')}</p>
        <div className="card">
          <label htmlFor="rec-desc" className="note">{t('What happened? For example: I clicked a link in a text.')}</label>
          <textarea id="rec-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('What happened? For example: I clicked a link in a text.')} style={{ marginTop: 6 }} />
          <p><button onClick={() => act({ action: 'start', description: desc })}>{t('Start recovery mode')}</button></p>
        </div>
        {msg && <p className="note" role="status">{msg}</p>}
      </>
    );
  }

  const r = state.recovery || { done: [], quizPassed: false };
  return (
    <>
      <h1>{t('Recovery mode')}</h1>
      <p className="sub">{t('Quests are paused until you finish the steps and the short quiz. Failing the quiz never costs points.')}</p>
      <div className="card">
        <h2>{t('Steps')}</h2>
        {STEPS.map((s) => (
          <div className="q" key={s.id}>
            <span>{r.done.includes(s.id) ? '✓ ' : ''}{t(s.title)}<br /><span className="note">{t(s.hint)}</span></span>
            {!r.done.includes(s.id) && <button className="ghost" onClick={() => act({ action: 'step', stepId: s.id })}>{t('I did this')}</button>}
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{t('Quick quiz')} {r.quizPassed ? t('(passed)') : ''}</h2>
        {QUIZ.map((q, i) => (
          <div key={i}>
            <p role="group" id={'quiz-q' + i}><b>{t(q.q)}</b></p>
            {q.o.map((o, j) => (
              <label key={j} style={{ display: 'block', fontSize: 14 }}>
                <input type="radio" name={'q' + i} aria-describedby={'quiz-q' + i} onChange={() => { const a = [...answers]; a[i] = j; setAnswers(a); }} /> {t(o)}
              </label>
            ))}
          </div>
        ))}
        <p><button onClick={() => act({ action: 'quiz', answers })}>{t('Submit quiz')}</button> {msg && <span className="note" role="status">{msg}</span>}</p>
      </div>
    </>
  );
}
