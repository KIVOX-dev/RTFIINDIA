import { useEffect, useRef, useState } from 'react';
import { Icon, Pill, AnimatedNumber, DataTable, Sparkline, EmptyState, Button } from '../ui/index.js';
import { delta, trend, num, waLink, fmtDate } from '../lib/format.js';

export function Change({ r, plain }) {
  const t = trend(r), d = delta(r);
  if (plain) return <span className={`chg ${t}`}>{d == null ? '–' : `${d > 0 ? '+' : ''}${num(d)}`}</span>;
  return (
    <Pill tone={t} aria-label={t === 'flat' ? 'No change' : `${t === 'up' ? 'Up' : 'Down'} ${Math.abs(d)}`}>
      {t !== 'flat' && <Icon name={t} size={13} strokeWidth={2.4} />}
      {d == null ? 'New' : t === 'flat' ? 'No change' : num(Math.abs(d))}
    </Pill>
  );
}

export function RateCell({ r, animate = true }) {
  const [flash, setFlash] = useState(false);
  const t = trend(r);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = () => { if (t === 'flat') return; setFlash(true); timer.current = setTimeout(() => setFlash(false), 1200); };
  return (
    <span className={`rate ${flash ? `flash-${t}` : ''}`}>
      {animate ? <AnimatedNumber value={r.rate} from={r.prev ?? r.rate} format={num} onStart={go} /> : num(r.rate)}
    </span>
  );
}

export function PriceTable({ rows, series, animate = true, view = 'table', caption }) {
  const [open, setOpen] = useState(null);
  const toggle = (_r, k) => setOpen((o) => (o === k ? null : k));
  const spark = (r) => (
    <div className="spark-panel">
      <div className="row wrap"><b>{r.item}</b><span className="muted">last 30 days</span></div>
      <Sparkline values={series?.series?.[r.item] || []} />
    </div>
  );
  if (view === 'cards')
    return (
      <div className="rate-cards">
        {rows.map((r) => (
          <div key={r.item} className="glass rate-card">
            <div className="row"><b>{r.item}</b><span className="spacer" /><span className="muted">{r.unit}</span></div>
            <div className="row" style={{ alignItems: 'baseline' }}>
              <span className="rate-big"><RateCell r={r} animate={animate} /></span><span className="spacer" /><Change r={r} />
            </div>
            {r.note && <p className="muted" style={{ fontSize: 13 }}>{r.note}</p>}
          </div>
        ))}
      </div>
    );
  return (
    <DataTable
      caption={caption} rows={rows} rowKey={(r) => r.item} onRowClick={series ? toggle : undefined} expandedKey={open} renderExpand={series ? spark : undefined}
      columns={[
        { key: 'item', label: 'Item', render: (r) => <><b>{r.item}</b>{r.note && <div className="muted" style={{ fontSize: 12 }}>{r.note}</div>}</> },
        { key: 'unit', label: 'Unit', render: (r) => <span className="muted">{r.unit}</span> },
        { key: 'rate', label: 'Rate', align: 'right', render: (r) => <RateCell r={r} animate={animate} /> },
        { key: 'chg', label: 'Change', align: 'right', render: (r) => <Change r={r} /> },
      ]}
    />
  );
}

export function PriceEmpty() {
  return <div className="glass"><EmptyState title="Today's rates will be published soon" text="The RTF office updates the price list every day. Please check back shortly." /></div>;
}

export function shareText(list, type, url) {
  const title = type === 'yarn' ? 'RTF Yarn Price List' : 'RTF CAI Spot Rate';
  const lines = list.rows.slice(0, 12).map((r) => {
    const d = delta(r);
    return `${r.item}: ${r.unit?.includes('₹') ? '₹' : ''}${num(r.rate)}${d ? (d > 0 ? ` ▲${num(d)}` : ` ▼${num(Math.abs(d))}`) : ''}`;
  });
  return `${title} - ${fmtDate(list.date)}\n${lines.join('\n')}\n${url}`;
}
export const ShareButton = ({ list, type }) => (
  <Button variant="glass" size="sm" icon="whatsapp" href={waLink(shareText(list, type, window.location.origin + `/prices/${type}`))}>Share on WhatsApp</Button>
);
