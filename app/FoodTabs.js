'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FoodTabs() {
  const path = usePathname() || '';
  return (
    <div className="seg" role="tablist" aria-label="Food">
      <Link href="/groceries" className={path.startsWith('/groceries') ? 'on' : ''}>Compare groceries</Link>
      <Link href="/food" className={path.startsWith('/food') ? 'on' : ''}>Free food nearby</Link>
    </div>
  );
}
