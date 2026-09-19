'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBlip } from './useBlip';
import Icon from './Icons';

const STUDENT = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/check', label: 'Check', icon: 'sliders' },
  { href: '/scam', label: 'Scams', icon: 'shield' },
  { href: '/quests', label: 'Quests', icon: 'star' },
  { href: '/recovery', label: 'Help', icon: 'lifebuoy' },
];
const BANK = [
  { href: '/console', label: 'Console', icon: 'chart' },
  { href: '/bank', label: 'Simulator', icon: 'terminal' },
];

export default function Shell({ children }) {
  const path = usePathname() || '/';
  const bank = path.startsWith('/bank') || path.startsWith('/console');
  const { state } = useBlip();
  const items = bank ? BANK : STUDENT;
  const isActive = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <div className={'shell' + (bank ? ' bank' : '')}>
      <aside className="sidebar">
        <Link href={bank ? '/console' : '/'} className="brandrow">
          <img src="/logo-mark.png" alt="" width="32" height="32" />
          <span>TheBlip</span>
        </Link>
        <div className="side-label">{bank ? 'Bank view · demo' : 'Student app'}</div>
        <nav className="sidenav">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={'navitem' + (isActive(i.href) ? ' active' : '')}>
              <Icon name={i.icon} /> {i.label}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          {!bank && state && (
            <div className="levelcard">
              <div className="lc-top"><b>Level {state.level.index + 1}</b><span>{state.level.name}</span></div>
              <div className="prog"><div style={{ width: state.level.progress + '%' }} /></div>
              <div className="lc-pts">{state.points} points</div>
            </div>
          )}
          <Link href={bank ? '/' : '/console'} className="switch">
            <Icon name={bank ? 'arrowLeft' : 'bank'} size={18} />
            {bank ? 'Back to student app' : 'Bank view'}
          </Link>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <Link href={bank ? '/console' : '/'} className="brandrow">
            <img src="/logo-mark.png" alt="" width="30" height="30" />
            <span>TheBlip</span>
          </Link>
          {bank ? <span className="chip">Bank view</span> : state && <span className="chip">{state.points} pts · Lv {state.level.index + 1}</span>}
        </header>
        {!bank && state && state.locked && (
          <div className="lockbar">
            <Icon name="lock" size={18} />
            <span>Recovery mode is on. <Link href="/recovery">Finish the steps</Link> to unlock quests.</span>
          </div>
        )}
        <main className="page">{children}</main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={'tab' + (isActive(i.href) ? ' active' : '')}>
            <Icon name={i.icon} size={22} />
            <span>{i.label}</span>
          </Link>
        ))}
        {bank && (
          <Link href="/" className="tab"><Icon name="arrowLeft" size={22} /><span>Student</span></Link>
        )}
      </nav>
    </div>
  );
}
