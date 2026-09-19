'use client';
import { useState } from 'react';
import { post } from '../useBlip';

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

export default function Check() {
  const [cb, setCb] = useState(5);
  const [spend, setSpend] = useState(400);
  const [apr, setApr] = useState(24);
  const [bal, setBal] = useState(600);
  const [pay, setPay] = useState(50);
  const [msg, setMsg] = useState('');

  const rewards = Math.round(spend * 12 * cb / 100);
  const interest = Math.round(bal * apr / 100);
  const net = rewards - interest;
  const max = Math.max(rewards, interest, 1);
  const plan = payoff(bal, apr, pay);

  async function savePlan() {
    if (bal > 0 && plan.months === Infinity) { setMsg('That payment does not cover the monthly interest. Try a higher amount.'); return; }
    const r = await post('/api/events', { type: 'payoff_plan_written' });
    setMsg(r.message || 'Saved.');
  }

  return (
    <>
      <h1>Reward reality check</h1>
      <p className="sub">Is that card offer worth it for you? Move the sliders.</p>
      <div className="card">
        <div className="row"><label>Cash back offer</label><input type="range" min="1" max="6" value={cb} onChange={(e) => setCb(+e.target.value)} style={sliderStyle(cb, 1, 6)} /><span className="val">{cb}%</span></div>
        <div className="row"><label>Monthly spend</label><input type="range" min="100" max="1000" step="50" value={spend} onChange={(e) => setSpend(+e.target.value)} style={sliderStyle(spend, 100, 1000)} /><span className="val">${spend}</span></div>
        <div className="row"><label>Card APR</label><input type="range" min="15" max="30" value={apr} onChange={(e) => setApr(+e.target.value)} style={sliderStyle(apr, 15, 30)} /><span className="val">{apr}%</span></div>
        <div className="row"><label>Balance you carry</label><input type="range" min="0" max="2000" step="50" value={bal} onChange={(e) => setBal(+e.target.value)} style={sliderStyle(bal, 0, 2000)} /><span className="val">${bal}</span></div>
        <div className="row"><label>Rewards per year</label><div className="bar good" style={{ width: Math.max(8, rewards / max * 100) + '%' }}>${rewards.toLocaleString()}</div></div>
        <div className="row"><label>Interest per year</label><div className="bar bad" style={{ width: Math.max(8, interest / max * 100) + '%' }}>${interest.toLocaleString()}</div></div>
        <p className={net >= 0 ? 'note' : 'err'}>
          {net >= 0 ? 'Rewards win by $' + net.toLocaleString() + ' a year, but only while you keep the balance near zero. Remember: you are borrowing, not spending.' : 'You lose $' + Math.abs(net).toLocaleString() + ' a year. The rewards do not cover the interest.'}
        </p>
      </div>
      <div className="card">
        <h2>Your backup plan</h2>
        <p className="note">How will you pay the ${bal} off?</p>
        <div className="row"><label>Monthly payment</label><input type="range" min="10" max="500" step="10" value={pay} onChange={(e) => setPay(+e.target.value)} style={sliderStyle(pay, 10, 500)} /><span className="val">${pay}</span></div>
        <p>{bal === 0 ? 'No balance to pay off.' : plan.months === Infinity ? 'At this payment the balance never shrinks. The interest eats it.' : 'Debt-free in ' + plan.months + ' months, paying about $' + plan.interest + ' in interest.'}</p>
        <button onClick={savePlan}>Save my payoff plan</button> {msg && <span className="note">{msg}</span>}
      </div>
    </>
  );
}
