export function distanceMiles(a, b) {
  const R = 3958.8;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatMiles(m) {
  if (m < 0.1) return 'under 0.1 mi';
  return (m < 10 ? m.toFixed(1) : Math.round(m)) + ' mi';
}

export function sortByDistance(places, from) {
  return places.map((p) => ({ ...p, miles: distanceMiles(from, p) })).sort((a, b) => a.miles - b.miles);
}
