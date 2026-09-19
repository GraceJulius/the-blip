'use client';
import { useState } from 'react';
import { useBlip, post } from '../useBlip';

const STEPS = [
  { id: 'freeze_card', title: 'Freeze the card', hint: 'In the real product the bank confirms this automatically (use the Bank simulator).' },
  { id: 'change_passwords', title: 'Change passwords for accounts you use', hint: 'Start with email and banking.' },
  { id: 'report', title: 'Report it to your bank and to reportfraud.ftc.gov', hint: 'Reporting helps other students too.' },
];
const QUIZ = [
  { q: 'You clicked a scam link but entered nothing. Best first move?', o: ['Ignore it', 'Change passwords and watch for odd activity', 'Reply to the sender'] },
  { q: 'Someone claiming to be your bank asks for a code they just texted you. You:', o: ['Read the code', 'Hang up and call the number on your card', 'Text the code back'] },
  { q: 'Who should hear about a card scam first?', o: ['Nobody', 'Your bank', 'The sender'] },
];

export default function Recovery() {
  const { state, refresh } = useBlip();
  const [desc, setDesc] = useState('');
  const [answers, setAnswers] = useState([]);
  const [msg, setMsg] = useState('');
  if (!state) return <p>Loading…</p>;

  async function act(body) {
    const r = await post('/api/recovery', body);
    if (r.error) setMsg(r.error);
    if (r.score !== undefined) setMsg(r.passed ? 'Quiz passed.' : 'You got ' + r.score + '/' + r.total + '. ' + r.note);
    refresh();
  }

  if (!state.locked) {
    return (
      <>
        <h1>I think I got scammed</h1>
        <p className="sub">No shame. Reporting earns points, and we walk you through what to do.</p>
        <div className="card">
          <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What happened? For example: I clicked a link in a text." />
          <p><button onClick={() => act({ action: 'start', description: desc })}>Start recovery mode</button></p>
        </div>
        {msg && <p className="note">{msg}</p>}
      </>
    );
  }

  const r = state.recovery || { done: [], quizPassed: false };
  return (
    <>
      <h1>Recovery mode</h1>
      <p className="sub">Quests are paused until you finish the steps and the short quiz. Failing the quiz never costs points.</p>
      <div className="card">
        <h2>Steps</h2>
        {STEPS.map((s) => (
          <div className="q" key={s.id}>
            <span>{r.done.includes(s.id) ? '✓ ' : ''}{s.title}<br /><span className="note">{s.hint}</span></span>
            {!r.done.includes(s.id) && <button className="ghost" onClick={() => act({ action: 'step', stepId: s.id })}>I did this</button>}
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Quick quiz {r.quizPassed ? '(passed)' : ''}</h2>
        {QUIZ.map((q, i) => (
          <div key={i}>
            <p><b>{q.q}</b></p>
            {q.o.map((o, j) => (
              <label key={j} style={{ display: 'block', fontSize: 14 }}>
                <input type="radio" name={'q' + i} onChange={() => { const a = [...answers]; a[i] = j; setAnswers(a); }} /> {o}
              </label>
            ))}
          </div>
        ))}
        <p><button onClick={() => act({ action: 'quiz', answers })}>Submit quiz</button> {msg && <span className="note">{msg}</span>}</p>
      </div>
    </>
  );
}
