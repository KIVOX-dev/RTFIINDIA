import { useMemo, useState } from 'react';
import { Dropdown, Tabs, Skeleton } from '../../ui/index.js';
import { useFetch } from '../../lib/api.js';
import { fmtDate, num } from '../../lib/format.js';

const W = 640, H = 220, PX = 44, PY = 18;

/** Small dependency-free SVG line chart with a hover/touch read-out. */
function Line({ dates, values }) {
  const [hover, setHover] = useState(null);
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return <p className="muted small chart-empty">Not enough history yet for this item.</p>;
  const ys = pts.map((p) => p[1]);
  const min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
  const X = (i) => PX + (i / (values.length - 1)) * (W - PX - 10);
  const Y = (v) => H - PY - ((v - min) / span) * (H - PY * 2);
  const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(pts[pts.length - 1][0]).toFixed(1)} ${H - PY} L${X(pts[0][0]).toFixed(1)} ${H - PY} Z`;
  const move = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * W;
    const i = Math.round(((x - PX) / (W - PX - 10)) * (values.length - 1));
    const cand = pts.reduce((a, p) => (Math.abs(p[0] - i) < Math.abs(a[0] - i) ? p : a), pts[0]);
    setHover(cand);
  };
  const last = pts[pts.length - 1];
  const show = hover || last;
  const mid = (min + max) / 2;
  return (
    <div className="chart">
      <div className="chart-read"><b>{num(show[1])}</b><span className="muted small">{fmtDate(dates[show[0]], { day: 'numeric', month: 'short' })}</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Rate trend from ${num(ys[0])} to ${num(last[1])}`}
        onPointerMove={move} onPointerLeave={() => setHover(null)} onPointerDown={move}>
        <defs><linearGradient id="chg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#305eff" stopOpacity=".22" /><stop offset="1" stopColor="#305eff" stopOpacity="0" /></linearGradient></defs>
        {[min, mid, max].map((v) => (
          <g key={v}><line x1={PX} x2={W - 10} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={PX - 6} y={Y(v) + 4} textAnchor="end" className="chart-t">{num(Math.round(v * 100) / 100)}</text></g>
        ))}
        <path d={area} fill="url(#chg)" />
        <path d={d} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={X(show[0])} cy={Y(show[1])} r="5" fill="var(--blue)" stroke="#fff" strokeWidth="2" />
        <text x={PX} y={H - 2} className="chart-t">{fmtDate(dates[0], { day: 'numeric', month: 'short' })}</text>
        <text x={W - 10} y={H - 2} textAnchor="end" className="chart-t">{fmtDate(dates[dates.length - 1], { day: 'numeric', month: 'short' })}</text>
      </svg>
    </div>
  );
}

export default function PriceChart({ type }) {
  const [days, setDays] = useState('30');
  const [item, setItem] = useState('');
  const { data, loading } = useFetch(`/prices/${type}/series?days=${days}`, { member: true, silent: true });
  const items = useMemo(() => Object.keys(data?.series || {}), [data]);
  const cur = items.includes(item) ? item : items[0] || '';
  return (
    <div className="glass pad chart-card">
      <div className="row wrap" style={{ gap: 12 }}>
        <h3 className="h3">Price trend</h3>
        <span className="spacer" />
        {items.length > 0 && <Dropdown label="Item" value={cur} onChange={setItem} options={items.map((x) => ({ value: x, label: x }))} />}
        <Tabs label="Range" value={days} onChange={setDays} tabs={[{ value: '30', label: '30d' }, { value: '60', label: '60d' }, { value: '90', label: '90d' }]} />
      </div>
      {loading && !data ? <Skeleton h={220} r={12} /> : cur ? <Line dates={data.dates} values={data.series[cur]} /> : <p className="muted small chart-empty">No history yet.</p>}
    </div>
  );
}
