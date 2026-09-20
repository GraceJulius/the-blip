'use client';
import { useState } from 'react';
import { post } from '../useBlip';
import { fileToUpload } from '../imageUpload';
import { useT } from '../i18n';

function payoff(balance, apr, pay) {
  const r = apr / 100 / 12;
  if (balance <= 0) return { months: 0, interest: 0 };
  if (pay <= balance * r) return { months: Infinity, interest: Infinity };
  const months = Math.ceil(-Math.log(1 - (r * balance) / pay) / Math.log(1 + r));
  return { months, interest: Math.round(pay * months - balance) };
}

function sliderStyle(value, min, max) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return {
    '--track-fill': `${percent}%`,
  };
}

// Made-up statement for demos and judging. Nothing here is a real account.
const SAMPLE = { apr: 24.99, balance: 1200, creditLimit: 2000, minimumPayment: 35, dueDate: 'sample data', cashBackPercent: 1.5, annualFee: 0, notes: [] };

export default function Check() {
  const t = useT();
  const [cb, setCb] = useState(5);
  const [spend, setSpend] = useState(400);
  const [apr, setApr] = useState(24);
  const [bal, setBal] = useState(600);
  const [pay, setPay] = useState(50);
  const [msg, setMsg] = useState('');
  const [fee, setFee] = useState(0);
  const [reading, setReading] = useState(false);
  const [found, setFound] = useState(null);
  const [readErr, setReadErr] = useState('');

  const rewards = Math.round(spend * 12 * cb / 100);
  const interest = Math.round(bal * apr / 100);
  const net = rewards - interest - fee;
  const max = Math.max(rewards, interest, 1);
  const plan = payoff(bal, apr, pay);

  async function readFile(file) {
    if (!file) return;
    setReading(true); setReadErr(''); setFound(null);
    try {
      const up = await fileToUpload(file);
      const r = await post('/api/statement/read', up);
      if (r.error) { setReadErr(r.error); setReading(false); return; }
      const d = r.reading;
      if (d.apr !== null) setApr(Math.max(5, Math.min(40, Math.round(d.apr))));
      if (d.balance !== null) setBal(Math.max(0, Math.min(10000, Math.round(d.balance / 50) * 50)));
      if (d.minimumPayment !== null) setPay(Math.max(5, Math.min(1000, Math.round(d.minimumPayment / 5) * 5)));
      if (d.cashBackPercent !== null) setCb(Math.max(0.5, Math.min(6, Math.round(d.cashBackPercent * 2) / 2)));
      setFee(d.annualFee || 0);
      setFound({ reading: d, analysis: r.analysis, questAward: r.questAward, privacy: r.privacy });
    } catch (e) {
      setReadErr(e.message || t('Something went wrong reading that file.'));
    }
    setReading(false);
  }

  function useSample() {
    const d = SAMPLE;
    setReadErr('');
    setApr(Math.round(d.apr)); setBal(d.balance); setPay(d.minimumPayment); setCb(d.cashBackPercent); setFee(d.annualFee);
    setFound({
      reading: d,
      analysis: { utilization: Math.round((d.balance / d.creditLimit) * 100), minPayoff: payoff(d.balance, d.apr, d.minimumPayment) },
      questAward: 0,
      privacy: null,
      sample: true,
    });
  }

  async function savePlan() {
    if (bal > 0 && plan.months === Infinity) { setMsg(t('That payment does not cover the monthly interest. Try a higher amount.')); return; }
    const r = await post('/api/events', { type: 'payoff_plan_written' });
    setMsg(r.message || t('Saved.'));
  }

  return (
    <>
      <h1>{t('Reward reality check')}</h1>
      <p className="sub">{t('Is that card offer worth it for you? Start from a sample statement, or move the sliders.')}</p>

      <div className="card">
        <h2>{t('Start from a statement')}</h2>
        <p className="note" style={{ marginBottom: 12 }}>{t('Try it with a made-up sample statement. Claude can also read a photo or PDF of a card statement or an offer and fill in the sliders below. For demos, please do not upload real account documents. If you do use your own, cover your name and account number: the file is read once and not saved.')}</p>
        <button onClick={useSample} style={{ marginRight: 8 }}>{t('Use a sample statement')}</button>
        <label className="btn ghost" style={{ cursor: reading ? 'wait' : 'pointer' }}>
          {reading ? t('Reading…') : t('Upload a statement or offer')}
          <input type="file" accept="image/*,application/pdf" disabled={reading} className="sr-only-file" onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
        </label>
        {readErr && <p className="err" role="alert" style={{ marginTop: 10 }}>{readErr}</p>}
        {found && (
          <div style={{ marginTop: 14 }}>
            {found.sample && <p className="note"><b>{t('Sample data.')}</b> {t('Made up for demos. Not a real account.')}</p>}
            {found.questAward > 0 && <p><b>{t('Quest complete: +{n} points', { n: found.questAward })}</b> {t('for reading your real statement.')}</p>}
            <div className="chips">
              {found.reading.apr !== null && <span className="pill">{t('APR {n}%', { n: found.reading.apr })}</span>}
              {found.reading.balance !== null && <span className="pill">{t('Balance ${n}', { n: found.reading.balance.toLocaleString() })}</span>}
              {found.reading.creditLimit !== null && <span className="pill">{t('Limit ${n}', { n: found.reading.creditLimit.toLocaleString() })}</span>}
              {found.reading.minimumPayment !== null && <span className="pill">{t('Minimum ${n}', { n: found.reading.minimumPayment.toLocaleString() })}</span>}
              {found.reading.dueDate && <span className="pill">{t('Due {d}', { d: found.reading.dueDate === 'sample data' ? t('sample data') : found.reading.dueDate })}</span>}
              {found.reading.cashBackPercent !== null && <span className="pill">{t('Cash back {n}%', { n: found.reading.cashBackPercent })}</span>}
              {found.reading.annualFee !== null && <span className="pill warn">{t('Annual fee ${n}', { n: found.reading.annualFee })}</span>}
            </div>
            {found.analysis.utilization !== null && (
              <p style={{ margin: '12px 0 4px' }}><b>{t('You are using {n}% of your limit.', { n: found.analysis.utilization })}</b> {found.analysis.utilization > 30 ? t('Staying under 30% is better for your credit score.') : t('That is under the 30% mark, which is good for your credit score.')}</p>
            )}
            {found.analysis.minPayoff && (
              <p style={{ margin: '4px 0' }}>{found.analysis.minPayoff.months === Infinity ? t('At the minimum payment the balance would never shrink, because the interest eats it.') : t('Paying only the minimum, you would be paying for about {m} months and about ${i} in interest.', { m: found.analysis.minPayoff.months, i: found.analysis.minPayoff.interest.toLocaleString() })}</p>
            )}
            {found.reading.notes.map((n, i) => <p key={i} className="note" style={{ margin: '4px 0' }}>{n}</p>)}
            <p className="note" style={{ marginTop: 8 }}>{t('Check these against your document. The sliders below were set from them, and you can change any of them.')}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row"><label htmlFor="chk-cb">{t('Cash back offer')}</label><input id="chk-cb" aria-valuetext={`${cb}%`} type="range" min="0.5" max="6" step="0.5" value={cb} onChange={(e) => setCb(+e.target.value)} style={sliderStyle(cb, 0.5, 6)} /><span className="val">{cb}%</span></div>
        <div className="row"><label htmlFor="chk-spend">{t('Monthly spend')}</label><input id="chk-spend" aria-valuetext={`$${spend}`} type="range" min="100" max="1000" step="50" value={spend} onChange={(e) => setSpend(+e.target.value)} style={sliderStyle(spend, 100, 1000)} /><span className="val">${spend}</span></div>
        <div className="row"><label htmlFor="chk-apr">{t('Card APR')}</label><input id="chk-apr" aria-valuetext={`${apr}%`} type="range" min="5" max="40" value={apr} onChange={(e) => setApr(+e.target.value)} style={sliderStyle(apr, 5, 40)} /><span className="val">{apr}%</span></div>
        <div className="row"><label htmlFor="chk-bal">{t('Balance you carry')}</label><input id="chk-bal" aria-valuetext={`$${bal}`} type="range" min="0" max="10000" step="50" value={bal} onChange={(e) => setBal(+e.target.value)} style={sliderStyle(bal, 0, 10000)} /><span className="val">${bal}</span></div>
        <div className="row"><label>{t('Rewards per year')}</label><div className="bar good" style={{ width: Math.max(8, rewards / max * 100) + '%' }}>${rewards.toLocaleString()}</div></div>
        <div className="row"><label>{t('Interest per year')}</label><div className="bar bad" style={{ width: Math.max(8, interest / max * 100) + '%' }}>${interest.toLocaleString()}</div></div>
        <p className={net >= 0 ? 'note' : 'err'} role="status">
          {net >= 0
            ? (fee ? t('Rewards win by ${n} a year after the ${f} annual fee, but only while you keep the balance near zero. Remember: you are borrowing, not spending.', { n: net.toLocaleString(), f: fee }) : t('Rewards win by ${n} a year, but only while you keep the balance near zero. Remember: you are borrowing, not spending.', { n: net.toLocaleString() }))
            : (fee
              ? (interest > 0 ? t('You lose ${n} a year including the ${f} annual fee. The rewards do not cover the interest.', { n: Math.abs(net).toLocaleString(), f: fee }) : t('You lose ${n} a year including the ${f} annual fee. The rewards do not cover the fee.', { n: Math.abs(net).toLocaleString(), f: fee }))
              : (interest > 0 ? t('You lose ${n} a year. The rewards do not cover the interest.', { n: Math.abs(net).toLocaleString() }) : t('You lose ${n} a year. The rewards do not cover the fee.', { n: Math.abs(net).toLocaleString() })))}
        </p>
      </div>
      <div className="card">
        <h2>{t('Your backup plan')}</h2>
        <p className="note">{t('How will you pay the ${n} off?', { n: bal })}</p>
        <div className="row"><label htmlFor="chk-pay">{t('Monthly payment')}</label><input id="chk-pay" aria-valuetext={`$${pay}`} type="range" min="5" max="1000" step="5" value={pay} onChange={(e) => setPay(+e.target.value)} style={sliderStyle(pay, 5, 1000)} /><span className="val">${pay}</span></div>
        <p>{bal === 0 ? t('No balance to pay off.') : plan.months === Infinity ? t('At this payment the balance never shrinks. The interest eats it.') : t('Debt-free in {m} months, paying about ${i} in interest.', { m: plan.months, i: plan.interest })}</p>
        <button onClick={savePlan}>{t('Save my payoff plan')}</button> {msg && <span className="note" role="status">{msg}</span>}
      </div>
    </>
  );
}
