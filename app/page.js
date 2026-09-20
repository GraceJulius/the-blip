'use client';
import Link from 'next/link';
import { useBlip } from './useBlip';
import Icon from './Icons';
import ReadAloud from './ReadAloud';
import Translated from './Translated';
import { LangSelect } from './lang';
import { useT } from './i18n';
import { T } from '@/lib/i18n.mjs';

const TOOLS = [
  { href: '/check', icon: 'sliders', title: T('Reality check'), desc: T('See what a card offer really costs you.') },
  { href: '/scam', icon: 'shield', title: T('Scam check'), desc: T('Paste a message and find out if it is a scam.') },
  { href: '/quests', icon: 'star', title: T('Quests'), desc: T('Earn points for safe money habits.') },
  { href: '/groceries', icon: 'basket', title: T('Groceries and free food'), desc: T('Compare stores on price and health, or find free food nearby.') },
];

function label(l, quests) {
  if (l.type === 'quest') {
    const q = quests.find((x) => x.id === l.questId);
    return q ? q.title : T('Quest completed');
  }
  return { scam_reported: T('Reported a scam'), incident_reported: T('Reported an incident'), recovery_completed: T('Finished recovery'), redeem: T('Redeemed a gift card'), quiz_bonus: T('Quiz bonus') }[l.type] || l.type;
}

function ago(ts, t) {
  const s = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return t('just now');
  if (s < 3600) return t('{n} min ago', { n: Math.round(s / 60) });
  if (s < 86400) return t('{n} h ago', { n: Math.round(s / 3600) });
  return t('{n} d ago', { n: Math.round(s / 86400) });
}

export default function Home() {
  const { state } = useBlip();
  const t = useT();
  const nextQuest = state && state.quests.find((q) => !q.done);
  return (
    <>
      <h1>{t('Know the cost before you swipe')}</h1>
      <p className="sub">{t('Check a card offer, test a suspicious message, and earn points for safe money habits.')}</p>

      {state && (
        <div className="card">
          <div className="lvl">
            <div className="num">{state.level.index + 1}</div>
            <div className="info">
              <div className="name">{t(state.level.name)}</div>
              <div className="prog" role="progressbar" aria-label={t('Level progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.level.progress)}><div style={{ width: state.level.progress + '%' }} /></div>
              <div className="note">
                {t('{xp} XP', { xp: state.xp })}{state.level.nextName ? ' · ' + t('{n} to {name}', { n: state.level.nextXp - state.xp, name: t(state.level.nextName) }) : ' · ' + t('top level')} · {t('{n} points to spend', { n: state.points })}
              </div>
            </div>
          </div>
        </div>
      )}

      {state && state.alerts && state.alerts.length > 0 && (
        <div className="card">
          <h2>{t('From your bank (sandbox)')}</h2>
          <p style={{ margin: '0 0 8px' }}><LangSelect /></p>
          {state.alerts.map((a, i) => (
            <div key={a.ts + i} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 0 }}>
              <span className={'pill ' + (a.severity === 'good' ? 'ok' : a.severity === 'info' ? '' : 'warn')}>{a.severity === 'alert' ? t('Alert') : a.severity === 'warn' ? t('Heads-up') : a.severity === 'good' ? t('Nice') : t('Note')}</span>
              <p style={{ margin: '6px 0 2px' }}><b>{a.title}</b></p>
              <p className="note" style={{ margin: '0 0 6px' }}>{a.message}</p>
              <ReadAloud text={a.title + '. ' + a.message} />
              <Translated parts={[a.title, a.message]} />
            </div>
          ))}
        </div>
      )}

      {state && (state.locked ? (
        <Link href="/recovery" className="tile" style={{ marginBottom: 16 }}>
          <span className="ico"><Icon name="lifebuoy" /></span>
          <span><div className="t">{t('Finish recovery')}</div><div className="d">{t('Quests are paused until you complete the steps.')}</div></span>
          <span className="go"><Icon name="chevron" /></span>
        </Link>
      ) : nextQuest && (
        <Link href="/quests" className="tile" style={{ marginBottom: 16 }}>
          <span className="ico"><Icon name="star" /></span>
          <span><div className="t">{t('Next up: {title}', { title: nextQuest.title })}</div><div className="d">{t('Worth {n} points', { n: nextQuest.points })}</div></span>
          <span className="go"><Icon name="chevron" /></span>
        </Link>
      ))}

      <div className="tiles">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="tile">
            <span className="ico"><Icon name={tool.icon} /></span>
            <span><div className="t">{t(tool.title)}</div><div className="d">{t(tool.desc)}</div></span>
            <span className="go"><Icon name="chevron" /></span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2>{t('Recent activity')}</h2>
        {!state || state.recent.length === 0 ? (
          <p className="note">{t('Nothing yet. Complete a quest or report a scam to see it here.')}</p>
        ) : (
          <div className="list">
            {state.recent.map((l, i) => (
              <div className="item" key={i}>
                <span>{t(label(l, state.quests))}<div className="when">{ago(l.ts, t)}</div></span>
                <span className={'pill' + (l.delta < 0 ? '' : ' ok')}>{l.delta > 0 ? '+' : ''}{l.delta}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
