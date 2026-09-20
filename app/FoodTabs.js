'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from './i18n';
import { T } from '@/lib/i18n.mjs';

export default function FoodTabs() {
  const path = usePathname() || '';
  const t = useT();
  return (
    <nav className="seg" aria-label={t(T('Food'))}>
      <Link href="/groceries" className={path.startsWith('/groceries') ? 'on' : ''} aria-current={path.startsWith('/groceries') ? 'page' : undefined}>{t('Compare groceries')}</Link>
      <Link href="/food" className={path.startsWith('/food') ? 'on' : ''} aria-current={path.startsWith('/food') ? 'page' : undefined}>{t('Free food nearby')}</Link>
    </nav>
  );
}
