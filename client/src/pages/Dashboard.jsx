import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dropdown, EmptyState, GlassCard, Icon, Pill, Reveal, SkeletonRows, Tabs } from '../ui/index.js';
import { PriceTable } from '../components/Prices.jsx';
import { ErrorCard } from '../components/Shell.jsx';
import { useFetch } from '../lib/api.js';
import { useSeo } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';
import { fmtDate, fmtDateTime, delta } from '../lib/format.js';
import PriceChart from './dashboard/PriceChart.jsx';

const AskPanel = lazy(() => import('./dashboard/AskPanel.jsx'));
const ProfilePanel = lazy(() => import('./dashboard/ProfilePanel.jsx'));
const TITLES = { yarn: 'Yarn Price List', cai: 'CAI Spot Rate' };

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function downloadCsv(list, type) {
  const rows = [['Item', 'Unit', 'Rate', 'Previous', 'Change', 'Note'], ...list.rows.map((r) => [r.item, r.unit, r.rate, r.prev, delta(r), r.note])];
  const blob = new Blob([`﻿${rows.map((r) => r.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rtf-${type}-${list.date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Rates({ type }) {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const date = sp.get('date') || '';
  const list = useFetch(`/prices/${type}${date ? `?date=${date}` : ''}`, { member: true });
  const dates = useFetch(`/prices/${type}/dates`, { member: true, silent: true });
  const series = useFetch(`/prices/${type}/series?days=30`, { member: true, silent: true });
  const d = list.data;
  const rows = useMemo(() => (d?.rows || []).filter((r) => r.item.toLowerCase().includes(q.trim().toLowerCase())), [d, q]);
  if (list.error) return <ErrorCard title="Could not load rates" onRetry={list.reload} />;
  const latest = dates.data?.[0];
  return (
    <div className="stack-lg">
      <div className="row wrap toolbar no-print">
        <Dropdown label="Select date" icon="cal" value={date || latest || ''} options={(dates.data || []).map((x, i) => ({ value: x, label: i === 0 ? `${fmtDate(x)} (latest)` : fmtDate(x) }))}
          onChange={(v) => { const n = new URLSearchParams(sp); v === latest ? n.delete('date') : n.set('date', v); setSp(n); }} />
        <label className="search glass"><Icon name="search" size={18} /><span className="sr">Search items</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" /></label>
        <span className="spacer" />
        {d?.rows && <Button variant="glass" size="sm" icon="download" onClick={() => downloadCsv(d, type)}>CSV</Button>}
        {d?.poster && <Button variant="glass" size="sm" icon="doc" href={d.poster} download>{/\.pdf$/i.test(d.poster) ? 'Poster PDF' : 'Poster'}</Button>}
        <Button variant="glass" size="sm" icon="print" onClick={() => window.print()}>Print</Button>
      </div>

      {d?.date && (
        <div className="row wrap meta">
          <Pill icon="cal">{fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Pill>
          {d.isToday ? <Pill tone="new"><span className="dot" />Updated today</Pill> : <Pill tone="amber">Not today's list</Pill>}
          <span className="muted small">Updated at {fmtDateTime(d.updatedAt)} IST</span>
        </div>
      )}

      {d?.aiSummary && (
        <GlassCard className="pad ai-summary">
          <div className="row" style={{ gap: 8 }}><Icon name="sparkle" size={18} /><b>Market summary</b><Pill>AI</Pill></div>
          <p style={{ whiteSpace: 'pre-line' }}>{d.aiSummary}</p>
          <p className="muted small">Generated automatically from the published rates. Check the table for exact figures.</p>
        </GlassCard>
      )}

      {list.loading && !d ? <GlassCard><SkeletonRows n={8} /></GlassCard>
        : d?.empty ? <GlassCard><EmptyState title="Today's rates will be published soon" text="The RTF office updates the list every day. Please check back shortly." /></GlassCard>
          : rows.length === 0 ? <GlassCard className="pad"><p className="muted">No items match “{q}”.</p></GlassCard>
            : <PriceTable rows={rows} series={series.data} view="table" caption={`${TITLES[type]} for ${d.date}`} key={d.date} />}
      {d?.rows && <p className="muted small no-print">Tap a row to see its 30 day trend.</p>}
      {d?.rows && <PriceChart type={type} />}
    </div>
  );
}

export default function Dashboard() {
  useSeo('Member dashboard', 'Daily yarn and CAI rates for RTF members.');
  const { user, logout } = useUser();
  const [sp, setSp] = useSearchParams();
  const tab = ['yarn', 'cai', 'profile'].includes(sp.get('tab')) ? sp.get('tab') : 'yarn';
  const go = (t) => { const n = new URLSearchParams(); if (t !== 'yarn') n.set('tab', t); setSp(n, { replace: true }); };
  return (
    <div className="container page-pad section dash">
      <Reveal>
        <div className="row wrap price-head">
          <div>
            <p className="eyebrow">Member dashboard</p>
            <h1 className="h1">Welcome, {user.name.split(' ')[0]}</h1>
            {user.millName && <p className="muted">{user.millName}{user.city ? `, ${user.city}` : ''}</p>}
          </div>
          <span className="spacer" />
          <Button variant="ghost" size="sm" icon="logout" onClick={logout}>Sign out</Button>
        </div>
      </Reveal>
      <div className="no-print" style={{ margin: '20px 0' }}>
        <Tabs label="Dashboard section" value={tab} onChange={go} tabs={[{ value: 'yarn', label: 'Yarn' }, { value: 'cai', label: 'CAI' }, { value: 'profile', label: 'Profile' }]} />
      </div>
      <div className="dash-grid">
        <div>
          {tab === 'profile' ? <Suspense fallback={<SkeletonRows n={4} />}><ProfilePanel /></Suspense> : <Rates type={tab} key={tab} />}
        </div>
        <aside className="no-print"><Suspense fallback={<SkeletonRows n={4} />}><AskPanel /></Suspense></aside>
      </div>
    </div>
  );
}
