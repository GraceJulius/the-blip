'use client';
import { useState } from 'react';
import Icon from '../Icons';
import { PLACES, MORE_HELP, CHECKED } from '@/lib/pantries';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'campus', label: 'On campus' },
  { id: 'oakland', label: 'Oakland' },
  { id: 'nearby', label: 'Nearby' },
];

function mapsUrl(address) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
}

export default function Food() {
  const [filter, setFilter] = useState('all');
  const places = PLACES.filter((p) => filter === 'all' || p.group === filter);
  return (
    <>
      <h1>Free food near campus</h1>
      <p className="sub">Real places where students can get groceries at no cost. Hours change, so check the source before you go.</p>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.id} className={'ghost' + (filter === f.id ? ' on' : '')} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {places.map((p) => (
        <div className="card place" key={p.id}>
          <div className="place-head">
            <h2>{p.name}</h2>
            <span className={'pill' + (p.confirmed ? ' ok' : ' warn')}>{p.confirmed ? 'Checked ' + CHECKED : 'Confirm before you go'}</span>
          </div>
          <dl>
            <dt>Who can go</dt><dd>{p.who}</dd>
            <dt>Where</dt><dd><a href={mapsUrl(p.address)} target="_blank" rel="noreferrer">{p.address}</a></dd>
            <dt>Hours</dt><dd>{p.hours.map((h, i) => <div key={i}>{h}</div>)}</dd>
            <dt>Good to know</dt><dd>{p.notes}</dd>
            {p.contact && (<><dt>Contact</dt><dd><a href={p.contact.href}>{p.contact.label}</a></dd></>)}
            <dt>Source</dt><dd><a href={p.source.href} target="_blank" rel="noreferrer">{p.source.label}</a></dd>
          </dl>
        </div>
      ))}

      <div className="card">
        <h2>More places to look</h2>
        <div className="list">
          {MORE_HELP.map((m) => (
            <div className="item" key={m.href}>
              <a href={m.href} target={m.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{m.label}</a>
              <Icon name="arrowRight" size={16} />
            </div>
          ))}
        </div>
      </div>

      <p className="note">This list is a starting point, not a promise. Hours and rules change with the semester, so use the source link or contact to confirm. Nothing on this page is stored or shared.</p>
    </>
  );
}
