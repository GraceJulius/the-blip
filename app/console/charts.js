export function BarChart({ values, labels, height = 150, unit = '' }) {
  const max = Math.max(1, ...values);
  const w = 100 / values.length;
  return (
    <svg viewBox={'0 0 100 ' + (height / 4)} preserveAspectRatio="none" style={{ width: '100%', height }} role="img" aria-label="Bar chart by day">
      {values.map((v, i) => {
        const h = (v / max) * (height / 4 - 4);
        return (
          <g key={i}>
            <rect x={i * w + w * 0.12} y={height / 4 - h} width={w * 0.76} height={Math.max(h, v > 0 ? 0.6 : 0)} rx="0.6" fill="var(--accent)" opacity={v ? 1 : 0.25}>
              <title>{labels[i]}: {v}{unit}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

export function DayLabels({ labels }) {
  const pick = labels.map((l, i) => (i === 0 || i === labels.length - 1 || i === Math.floor(labels.length / 2) ? l.slice(5).replace('-', '/') : ''));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>
      {pick.filter(Boolean).map((l, i) => <span key={i}>{l}</span>)}
    </div>
  );
}

export function HBars({ items, empty = 'Nothing yet.' }) {
  if (!items.length) return <p className="note" style={{ margin: 0 }}>{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      {items.map((i) => (
        <div className="hbar" key={i.label}>
          <span title={i.label} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.label}</span>
          <span className="track"><span className="fill" style={{ display: 'block', width: (i.value / max) * 100 + '%' }} /></span>
          <span className="n">{i.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
