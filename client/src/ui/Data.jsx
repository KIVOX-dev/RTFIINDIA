import { Fragment } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { EASE } from './Motion.jsx';

export function Sparkline({ values = [], w = 600, h = 120, color = 'var(--blue)', animate = true, label = '30 day trend' }) {
  const rm = useReducedMotion();
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return <span className="muted" style={{ fontSize: 13 }}>Not enough history yet</span>;
  const ys = pts.map((p) => p[1]);
  const min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1, pad = 8;
  const X = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const Y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
  const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const area = `${d} L${X(last[0]).toFixed(1)} ${h - pad} L${X(pts[0][0]).toFixed(1)} ${h - pad} Z`;
  const gid = `g${Math.abs(d.length * 31 + Math.round(ys[0]))}`;
  const anim = animate && !rm;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label={`${label}: from ${ys[0]} to ${last[1]}`}>
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3395FF" stopOpacity=".28" /><stop offset="1" stopColor="#3395FF" stopOpacity="0" /></linearGradient></defs>
      <m.path d={area} fill={`url(#${gid})`} initial={anim ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
      <m.path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={anim ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: EASE }} />
      <circle cx={X(last[0])} cy={Y(last[1])} r="4" fill={color} />
    </svg>
  );
}

export function DataTable({ columns, rows, rowKey = (r, i) => i, onRowClick, expandedKey, renderExpand, caption, rowClass }) {
  return (
    <div className="table-wrap glass">
      <table className="dt">
        {caption && <caption className="sr">{caption}</caption>}
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.align === 'right' ? 'r' : ''} style={c.width ? { width: c.width } : undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const k = rowKey(r, i);
            const open = expandedKey === k;
            return (
              <Fragment key={k}>
                <tr className={`${onRowClick ? 'clickable' : ''} ${rowClass?.(r) || ''}`} tabIndex={onRowClick ? 0 : undefined} aria-expanded={renderExpand ? open : undefined}
                  onClick={() => onRowClick?.(r, k)} onKeyDown={(e) => { if (onRowClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick(r, k); } }}>
                  {columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'r' : ''}>{c.render ? c.render(r, i) : r[c.key]}</td>)}
                </tr>
                {open && renderExpand && <tr className="expand"><td colSpan={columns.length}>{renderExpand(r)}</td></tr>}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  const key = (e, i) => {
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (n == null) return;
    const t = tabs[(n + tabs.length) % tabs.length];
    onChange(t.value);
    e.currentTarget.parentElement.children[(n + tabs.length) % tabs.length]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button key={t.value} type="button" role="tab" className="tab" aria-selected={t.value === value} tabIndex={t.value === value ? 0 : -1} onClick={() => onChange(t.value)} onKeyDown={(e) => key(e, i)}>{t.label}</button>
      ))}
    </div>
  );
}
