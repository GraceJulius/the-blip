'use client';
import Link from 'next/link';
import { useBlip } from './useBlip';

export default function Nav() {
  const { state } = useBlip();
  return (
    <>
      <header className="nav">
        <Link href="/" className="brand">
          <img src="/logo-mark.png" alt="" width="30" height="30" />
          <span>TheBlip</span>
        </Link>
        <nav>
          <Link href="/check">Reality check</Link>
          <Link href="/scam">Scam check</Link>
          <Link href="/quests">Quests</Link>
          <Link href="/recovery">I got scammed</Link>
          <Link href="/bank">Bank simulator</Link>
          <Link href="/console">Bank console</Link>
        </nav>
        <span className="pts">{state ? state.points + ' pts · Lv ' + (state.level.index + 1) + ' ' + state.level.name : ''}</span>
      </header>
      {state && state.locked && (
        <div className="lock">Recovery mode is on. <Link href="/recovery">Finish the steps</Link> to unlock quests.</div>
      )}
    </>
  );
}
