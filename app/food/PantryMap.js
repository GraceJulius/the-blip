'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function PantryMap({ places, selectedId, onSelect, me }) {
  const el = useRef(null);
  const ref = useRef({});
  const latest = useRef({ places, selectedId, onSelect, me });
  latest.current = { places, selectedId, onSelect, me };

  function draw(fit) {
    const { L, map, layer } = ref.current;
    if (!map) return;
    const { places: ps, selectedId: sel, onSelect: pick, me: you } = latest.current;
    layer.clearLayers();
    const pts = [];
    ps.forEach((p) => {
      const cls = 'pin ' + (p.status === null ? 'unk' : p.status.open ? 'open' : 'closed') + (p.id === sel ? ' sel' : '');
      const icon = L.divIcon({ className: '', html: '<span class="' + cls + '"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
      const m = L.marker([p.lat, p.lng], { icon, title: p.name, keyboard: true });
      const box = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = p.name;
      const s = document.createElement('div');
      s.textContent = p.status ? p.status.text : 'Check hours before you go';
      box.append(b, s);
      m.bindPopup(box);
      m.on('click', () => pick(p.id));
      m.addTo(layer);
      ref.current.markers[p.id] = m;
      pts.push([p.lat, p.lng]);
    });
    if (you) {
      L.circleMarker([you.lat, you.lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }).bindTooltip('You are here').addTo(layer);
      pts.push([you.lat, you.lng]);
    }
    if (fit && pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current || ref.current.map) return;
      const map = L.map(el.current, { scrollWheelZoom: false }).setView([40.4406, -79.9559], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      ref.current = { L, map, layer: L.layerGroup().addTo(map), markers: {} };
      draw(true);
    })();
    return () => { cancelled = true; if (ref.current.map) { ref.current.map.remove(); ref.current = {}; } };
  }, []);

  const key = places.map((p) => p.id + (p.status ? (p.status.open ? 'o' : 'c') : 'u')).join() + '|' + (me ? me.lat + ',' + me.lng : '');
  useEffect(() => { draw(false); }, [key, selectedId]);
  useEffect(() => { if (me) draw(true); }, [me]);

  useEffect(() => {
    const { map, markers } = ref.current;
    const p = places.find((x) => x.id === selectedId);
    if (map && p) { map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 15), { duration: 0.6 }); if (markers[p.id]) markers[p.id].openPopup(); }
  }, [selectedId]);

  return <div ref={el} className="map" role="region" aria-label="Map of places to get free food" />;
}
