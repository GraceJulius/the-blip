'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBlip } from './useBlip';
import Icon from './Icons';
import Onboarding from './Onboarding';
import { useT } from './i18n';
import { LangSelect } from './lang';
import { T } from '@/lib/i18n.mjs';

const STUDENT = [
  { href: '/', label: T('Home'), icon: 'home' },
  { href: '/check', label: T('Check'), icon: 'sliders' },
  { href: '/scam', label: T('Scams'), icon: 'shield' },
  { href: '/quests', label: T('Quests'), icon: 'star' },
  { href: '/groceries', label: T('Food'), icon: 'basket', match: ['/groceries', '/food'] },
  { href: '/recovery', label: T('Help'), icon: 'lifebuoy' },
];
const BANK = [
  { href: '/console', label: T('Console'), icon: 'chart' },
  { href: '/bank', label: T('Simulator'), icon: 'terminal' },
  { href: '/docs', label: T('API docs'), icon: 'book' },
];

export default function Shell({ children }) {
  const path = usePathname() || '/';
  if (path.startsWith('/embed')) return <div className="embed-root">{children}</div>;
  return <AppShell path={path}>{children}</AppShell>;
}

function AppShell({ children, path }) {
  const bank = path.startsWith('/bank') || path.startsWith('/console') || path.startsWith('/docs');
  const { state } = useBlip();
  const t = useT();
  const items = bank ? BANK : STUDENT;

  const isActive = (i) => (i.match ? i.match.some((m) => path.startsWith(m)) : i.href === '/' ? path === '/' : path.startsWith(i.href));
  const help = (e) => window.dispatchEvent(new CustomEvent('blip-help', { detail: { opener: e.currentTarget } }));

  return (
    <div className={'shell' + (bank ? ' bank' : '')}>
      <a href="#main" className="skip">{t('Skip to main content')}</a>
      <aside className="sidebar" aria-label={t('Sidebar')}>
        <Link href={bank ? '/console' : '/'} className="brandrow">
          <img src="/logo-mark.png" alt="" width="32" height="32" />
          <span>TheBlip</span>
        </Link>
        <div className="side-label">{bank ? t('Bank view · demo') : t('Student app')}</div>
        <nav className="sidenav" aria-label={t('Main menu')}>
          {items.map((i) => (
            <Link key={i.href} href={i.href} className={'navitem' + (isActive(i) ? ' active' : '')} aria-current={isActive(i) ? 'page' : undefined}>
              <Icon name={i.icon} /> {t(i.label)}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          {!bank && state && (
            <div className="levelcard">
              <div className="lc-top"><b>{t('Level {n}', { n: state.level.index + 1 })}</b><span>{t(state.level.name)}</span></div>
              <div className="prog" role="progressbar" aria-label={t('Level progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.level.progress)}><div style={{ width: state.level.progress + '%' }} /></div>
              <div className="lc-pts">{t('{n} points', { n: state.points })}</div>
            </div>
          )}
          <p style={{ margin: '0 0 8px' }}><LangSelect compact /></p>
          <button className="switch helpbtn" onClick={help}>
            <Icon name="help" size={18} /> {t('How this page works')}
          </button>
          <Link href={bank ? '/' : '/console'} className="switch">
            <Icon name={bank ? 'arrowLeft' : 'bank'} size={18} />
            {bank ? t('Back to student app') : t('Bank view')}
          </Link>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <Link href={bank ? '/console' : '/'} className="brandrow">
            <img src="/logo-mark.png" alt="" width="30" height="30" />
            <span>TheBlip</span>
          </Link>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangSelect compact narrow />
            {bank ? <span className="chip">{t('Bank view')}</span> : state && <span className="chip">{t('{p} pts · Lv {l}', { p: state.points, l: state.level.index + 1 })}</span>}
            <button className="iconbtn" aria-label={t('How this page works')} onClick={help}><Icon name="help" size={20} /></button>
          </span>
        </header>
        {!bank && state && state.locked && (
          <div className="lockbar" role="status">
            <Icon name="lock" size={18} />
            <Link href="/recovery">{t('Recovery mode is on. Finish the steps to unlock quests.')}</Link>
          </div>
        )}
        <main className="page" id="main" tabIndex={-1}>{children}</main>
      </div>

      <nav className="tabbar" aria-label={t('Tab bar')}>
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={'tab' + (isActive(i) ? ' active' : '')} aria-current={isActive(i) ? 'page' : undefined}>
            <Icon name={i.icon} size={22} />
            <span>{t(i.label)}</span>
          </Link>
        ))}
        {bank && (
          <Link href="/" className="tab"><Icon name="arrowLeft" size={22} /><span>{t('Student')}</span></Link>
        )}
      </nav>
      <Onboarding />
    </div>
  );
}
