'use client';
import { useState } from 'react';
import { post } from '../useBlip';
import { fileToUpload } from '../imageUpload';

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
const SAMPLE = { apr: 24.99, balance: 1200, creditLimit: 2000, minimumPayment: 35, dueDate: 'sample data', cashBackPercent: 1.5, annualFee: 0, notes: ['This is a made-up sample statement. It is not a real account.'] };

export default function Check() {
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
      setReadErr(e.message || 'Something went wrong reading that file.');
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
    if (bal > 0 && plan.months === Infinity) { setMsg('That payment does not cover the monthly interest. Try a higher amount.'); return; }
    const r = await post('/api/events', { type: 'payoff_plan_written' });
    setMsg(r.message || 'Saved.');
  }

  return (
    <>
      <h1>Reward reality check</h1>
      <p className="sub">Is that card offer worth it for you? Start from a sample statement, or move the sliders.</p>

      <div className="card">
        <h2>Start from a statement</h2>
        <p className="note" style={{ marginBottom: 12 }}>Try it with a made-up sample statement. Claude can also read a photo or PDF of a card statement or an offer and fill in the sliders below. For demos, please do not upload real account documents. If you do use your own, cover your name and account number: the file is read once and not saved.</p>
        <button onClick={useSample} style={{ marginRight: 8 }}>Use a sample statement</button>
        <label className="btn ghost" style={{ cursor: reading ? 'wait' : 'pointer' }}>
          {reading ? 'Reading…' : 'Upload a statement or offer'}
          <input type="file" accept="image/*,application/pdf" disabled={reading} style={{ display: 'none' }} onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
        </label>
        {readErr && <p className="err" style={{ marginTop: 10 }}>{readErr}</p>}
        {found && (
          <div style={{ marginTop: 14 }}>
            {found.sample && <p className="note"><b>Sample data.</b> Made up for demos. Not a real account.</p>}
            {found.questAward > 0 && <p><b>Quest complete: +{found.questAward} points</b> for reading your real statement.</p>}
            <div className="chips">
              {found.reading.apr !== null && <span className="pill">APR {found.reading.apr}%</span>}
              {found.reading.balance !== null && <span className="pill">Balance ${found.reading.balance.toLocaleString()}</span>}
              {found.reading.creditLimit !== null && <span className="pill">Limit ${found.reading.creditLimit.toLocaleString()}</span>}
              {found.reading.minimumPayment !== null && <span className="pill">Minimum ${found.reading.minimumPayment.toLocaleString()}</span>}
              {found.reading.dueDate && <span className="pill">Due {found.reading.dueDate}</span>}
              {found.reading.cashBackPercent !== null && <span className="pill">Cash back {found.reading.cashBackPercent}%</span>}
              {found.reading.annualFee !== null && <span className="pill warn">Annual fee ${found.reading.annualFee}</span>}
            </div>
            {found.analysis.utilization !== null && (
              <p style={{ margin: '12px 0 4px' }}>You are using <b>{found.analysis.utilization}%</b> of your limit. {found.analysis.utilization > 30 ? 'Staying under 30% is better for your credit score.' : 'That is under the 30% mark, which is good for your credit score.'}</p>
            )}
            {found.analysis.minPayoff && (
              <p style={{ margin: '4px 0' }}>{found.analysis.minPayoff.months === Infinity ? 'At the minimum payment the balance would never shrink, because the interest eats it.' : 'Paying only the minimum, you would be paying for about ' + found.analysis.minPayoff.months + ' months and about $' + found.analysis.minPayoff.interest.toLocaleString() + ' in interest.'}</p>
            )}
            {found.reading.notes.map((n, i) => <p key={i} className="note" style={{ margin: '4px 0' }}>{n}</p>)}
            <p className="note" style={{ marginTop: 8 }}>Check these against your document. The sliders below were set from them, and you can change any of them.</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row"><label>Cash back offer</label><input type="range" min="0.5" max="6" step="0.5" value={cb} onChange={(e) => setCb(+e.target.value)} style={sliderStyle(cb, 0.5, 6)} /><span className="val">{cb}%</span></div>
        <div className="row"><label>Monthly spend</label><input type="range" min="100" max="1000" step="50" value={spend} onChange={(e) => setSpend(+e.target.value)} style={sliderStyle(spend, 100, 1000)} /><span className="val">${spend}</span></div>
        <div className="row"><label>Card APR</label><input type="range" min="5" max="40" value={apr} onChange={(e) => setApr(+e.target.value)} style={sliderStyle(apr, 5, 40)} /><span className="val">{apr}%</span></div>
        <div className="row"><label>Balance you carry</label><input type="range" min="0" max="10000" step="50" value={bal} onChange={(e) => setBal(+e.target.value)} style={sliderStyle(bal, 0, 10000)} /><span className="val">${bal}</span></div>
        <div className="row"><label>Rewards per year</label><div className="bar good" style={{ width: Math.max(8, rewards / max * 100) + '%' }}>${rewards.toLocaleString()}</div></div>
        <div className="row"><label>Interest per year</label><div className="bar bad" style={{ width: Math.max(8, interest / max * 100) + '%' }}>${interest.toLocaleString()}</div></div>
        <p className={net >= 0 ? 'note' : 'err'}>
          {net >= 0 ? 'Rewards win by $' + net.toLocaleString() + ' a year' + (fee ? ' after the $' + fee + ' annual fee' : '') + ', but only while you keep the balance near zero. Remember: you are borrowing, not spending.' : 'You lose $' + Math.abs(net).toLocaleString() + ' a year' + (fee ? ' including the $' + fee + ' annual fee' : '') + '. The rewards do not cover the ' + (interest > 0 ? 'interest' : 'fee') + '.'}
        </p>
      </div>
      <div className="card">
        <h2>Your backup plan</h2>
        <p className="note">How will you pay the ${bal} off?</p>
        <div className="row"><label>Monthly payment</label><input type="range" min="5" max="1000" step="5" value={pay} onChange={(e) => setPay(+e.target.value)} style={sliderStyle(pay, 5, 1000)} /><span className="val">${pay}</span></div>
        <p>{bal === 0 ? 'No balance to pay off.' : plan.months === Infinity ? 'At this payment the balance never shrinks. The interest eats it.' : 'Debt-free in ' + plan.months + ' months, paying about $' + plan.interest + ' in interest.'}</p>
        <button onClick={savePlan}>Save my payoff plan</button> {msg && <span className="note">{msg}</span>}
      </div>
    </>
  );
}
