'use client';
import Link from 'next/link';
import { useBlip } from './useBlip';
import Icon from './Icons';

const TOOLS = [
  { href: '/check', icon: 'sliders', title: 'Reality check', desc: 'See what a card offer really costs you.' },
  { href: '/scam', icon: 'shield', title: 'Scam check', desc: 'Paste a message and find out if it is a scam.' },
  { href: '/quests', icon: 'star', title: 'Quests', desc: 'Earn points for safe money habits.' },
];

function label(l, quests) {
  if (l.type === 'quest') {
    const q = quests.find((x) => x.id === l.questId);
    return q ? q.title : 'Quest completed';
  }
  return { scam_reported: 'Reported a scam', incident_reported: 'Reported an incident', recovery_completed: 'Finished recovery', redeem: 'Redeemed a gift card', quiz_bonus: 'Quiz bonus' }[l.type] || l.type;
}

function ago(ts) {
  const s = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return Math.round(s / 86400) + ' d ago';
}

export default function Home() {
  const { state } = useBlip();
  const nextQuest = state && state.quests.find((q) => !q.done);
  return (
    <>
      <h1>Know the cost before you swipe</h1>
      <p className="sub">Check a card offer, test a suspicious message, and earn points for safe money habits.</p>

      {state && (
        <div className="card">
          <div className="lvl">
            <div className="num">{state.level.index + 1}</div>
            <div className="info">
              <div className="name">{state.level.name}</div>
              <div className="prog"><div style={{ width: state.level.progress + '%' }} /></div>
              <div className="note">
                {state.xp} XP{state.level.nextName ? ' · ' + (state.level.nextXp - state.xp) + ' to ' + state.level.nextName : ' · top level'} · {state.points} points to spend
              </div>
            </div>
          </div>
        </div>
      )}

      {state && (state.locked ? (
        <Link href="/recovery" className="tile" style={{ marginBottom: 16 }}>
          <span className="ico"><Icon name="lifebuoy" /></span>
          <span><div className="t">Finish recovery</div><div className="d">Quests are paused until you complete the steps.</div></span>
          <span className="go"><Icon name="chevron" /></span>
        </Link>
      ) : nextQuest && (
        <Link href="/quests" className="tile" style={{ marginBottom: 16 }}>
          <span className="ico"><Icon name="star" /></span>
          <span><div className="t">Next up: {nextQuest.title}</div><div className="d">Worth {nextQuest.points} points</div></span>
          <span className="go"><Icon name="chevron" /></span>
        </Link>
      ))}

      <div className="tiles">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="tile">
            <span className="ico"><Icon name={t.icon} /></span>
            <span><div className="t">{t.title}</div><div className="d">{t.desc}</div></span>
            <span className="go"><Icon name="chevron" /></span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2>Recent activity</h2>
        {!state || state.recent.length === 0 ? (
          <p className="note">Nothing yet. Complete a quest or report a scam to see it here.</p>
        ) : (
          <div className="list">
            {state.recent.map((l, i) => (
              <div className="item" key={i}>
                <span>{label(l, state.quests)}<div className="when">{ago(l.ts)}</div></span>
                <span className={'pill' + (l.delta < 0 ? '' : ' ok')}>{l.delta > 0 ? '+' : ''}{l.delta}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
