'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Icon from '../Icons';
import FoodTabs from '../FoodTabs';
import { PLACES, MORE_HELP, CHECKED } from '@/lib/pantries';
import { openStatus } from '@/lib/openNow.mjs';
import { distanceMiles, formatMiles } from '@/lib/geo.mjs';

const PantryMap = dynamic(() => import('./PantryMap'), { ssr: false, loading: () => <div className="map" /> });

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'campus', label: 'On campus' },
  { id: 'oakland', label: 'Oakland' },
  { id: 'nearby', label: 'Nearby' },
];

const dirUrl = (p) => 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng;
const mapsUrl = (a) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);

export default function Food() {
  const [filter, setFilter] = useState('all');
  const [openOnly, setOpenOnly] = useState(false);
  const [now, setNow] = useState(null);
  const [me, setMe] = useState(null);
  const [geoMsg, setGeoMsg] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  function locate() {
    setGeoMsg('');
    if (!navigator.geolocation) { setGeoMsg('Your browser cannot share a location.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoMsg('We could not get your location. You can still browse the map.'),
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  let places = PLACES
    .filter((p) => filter === 'all' || p.group === filter)
    .map((p) => ({ ...p, status: now ? openStatus(p.schedule, now) : null, miles: me ? distanceMiles(me, p) : null }));
  const checkable = PLACES.filter((p) => (filter === 'all' || p.group === filter) && p.schedule).length;
  if (openOnly) places = places.filter((p) => p.status && p.status.open);
  if (me) places = [...places].sort((a, b) => a.miles - b.miles);

  return (
    <>
      <h1>Free food near campus</h1>
      <p className="sub">Real places where students can get groceries at no cost. Hours change, so check the source before you go.</p>
      <FoodTabs />

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.id} className={'ghost' + (filter === f.id ? ' on' : '')} onClick={() => { setFilter(f.id); setSelected(null); }}>{f.label}</button>
        ))}
        <button className={'ghost' + (openOnly ? ' on' : '')} onClick={() => setOpenOnly(!openOnly)}>Open now</button>
        <button className={'ghost' + (me ? ' on' : '')} onClick={locate}>{me ? 'Sorted by distance' : 'Use my location'}</button>
      </div>
      {geoMsg && <p className="note">{geoMsg}</p>}
      {me && <p className="note">Your location stays in your browser and is never sent to us.</p>}

      <div className="map-wrap"><PantryMap places={places} selectedId={selected} onSelect={setSelected} me={me} /></div>
      <p className="note" style={{ margin: '6px 0 14px' }}>Pin colors: <span className="dotk ok" /> open now · <span className="dotk closed" /> closed now · <span className="dotk unk" /> hours not confirmed. Only places with confirmed weekly hours show open or closed.</p>

      {places.length === 0 && (
        <div className="card">
          <h2>Nothing open right now in this list</h2>
          <p className="note" style={{ margin: 0 }}>{openOnly ? 'Only ' + checkable + ' of the places here have confirmed weekly hours we can check, and none of them is open at this moment. Turn off "Open now" to see everything.' : 'No places match.'}</p>
        </div>
      )}

      {places.map((p) => (
        <div className={'card place' + (p.id === selected ? ' sel' : '')} key={p.id} id={'place-' + p.id}>
          <div className="place-head">
            <h2>{p.name}</h2>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {p.miles !== null && <span className="pill">{formatMiles(p.miles)}{p.precision === 'area' ? ' (approx.)' : ''}</span>}
              {p.status && <span className={'pill ' + (p.status.open ? 'ok' : 'warn')}>{p.status.text}</span>}
              <span className={'pill' + (p.confirmed ? ' ok' : ' warn')}>{p.confirmed ? 'Checked ' + CHECKED : 'Confirm before you go'}</span>
            </span>
          </div>
          <div className="actions" style={{ marginTop: 4, marginBottom: 6 }}>
            <a className="btn small" href={dirUrl(p)} target="_blank" rel="noreferrer">Directions</a>
            {p.contact && p.contact.href.startsWith('tel:') && <a className="btn small ghostlink" href={p.contact.href}>Call {p.contact.label}</a>}
            <button className="ghost small" onClick={() => { setSelected(p.id); document.querySelector('.map-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Show on map</button>
          </div>
          <dl>
            <dt>Who can go</dt><dd>{p.who}</dd>
            <dt>Where</dt><dd><a href={mapsUrl(p.address)} target="_blank" rel="noreferrer">{p.address}</a>{p.precision === 'area' && <div className="note">The pin marks the area, not the exact door.</div>}</dd>
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

      <p className="note">This list is a starting point, not a promise. Hours and rules change with the semester, so use the source link or contact to confirm. Map data &copy; OpenStreetMap contributors.</p>
    </>
  );
}
