'use client';
import Link from 'next/link';
import { useBlip } from './useBlip';

export default function Home() {
  const { state } = useBlip();
  return (
    <>
      <h1>See the real cost before you swipe.</h1>
      <p className="sub">Every card pays you to spend. TheBlip pays you to not get hurt.</p>
      {state && (
        <div className="card">
          <h2>Level {state.level.index + 1}: {state.level.name}</h2>
          <div className="prog"><div style={{ width: state.level.progress + '%' }} /></div>
          <p className="note">
            {state.xp} XP{state.level.nextName ? ' · next: ' + state.level.nextName + ' at ' + state.level.nextXp : ' · top level'} · {state.points} points to spend
          </p>
        </div>
      )}
      <div className="grid">
        <Link className="card" href="/check"><h2>Reality check</h2><span className="note">Rewards vs interest, in dollars.</span></Link>
        <Link className="card" href="/scam"><h2>Scam check</h2><span className="note">Paste a message. Report it for points.</span></Link>
        <Link className="card" href="/quests"><h2>Quests</h2><span className="note">Earn points for safe habits.</span></Link>
      </div>
    </>
  );
}
