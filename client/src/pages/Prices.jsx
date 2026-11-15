import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Tabs, Pill, GlassCard, Skeleton, SkeletonRows, Icon, Reveal } from '../ui/index.js';
import { PriceTable, PriceEmpty, ShareButton } from '../components/Prices.jsx';
import { ErrorCard } from '../components/Shell.jsx';
import { useFetch } from '../lib/api.js';
import { useSettings, useSeo, useMedia } from '../lib/hooks.jsx';
import { fmtDate, fmtDateTime } from '../lib/format.js';

const TITLES = { yarn: 'Yarn Price List', cai: 'CAI Spot Rate' };
const SUBS = { yarn: 'Open End yarn rates from RTF member mills', cai: 'Cotton spot rates, updated daily' };

export default function Prices() {
  const { type } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { s } = useSettings();
  const small = useMedia('(max-width: 640px)');
  const [view, setView] = useState(() => { try { return localStorage.getItem('rtf_view'); } catch { return null; } });
  const [q, setQ] = useState('');
  const date = sp.get('date') || '';
  const valid = TITLES[type];
  useSeo(valid ? TITLES[type] : 'Prices', `${TITLES[type]} - ${SUBS[type]}`);
  const list = useFetch(valid ? `/prices/${type}${date ? `?date=${date}` : ''}` : null);
  const dates = useFetch(valid ? `/prices/${type}/dates` : null, { silent: true });
  const series = useFetch(valid ? `/prices/${type}/series?days=30` : null, { silent: true });
  const mode = view || (small ? 'cards' : 'table');
  const rows = useMemo(() => (list.data?.rows || []).filter((r) => r.item.toLowerCase().includes(q.trim().toLowerCase())), [list.data, q]);
  if (!valid) return <Navigate to="/prices/yarn" replace />;
  if (list.error) return <ErrorCard onRetry={list.reload} />;
  const d = list.data;
  const setMode = (v) => { setView(v); try { localStorage.setItem('rtf_view', v); } catch { /* storage blocked */ } };
  const header = type === 'cai' && s.cai?.headerUrl;
  return (
    <div className="container page-pad section prices-page">
      <Reveal>
        {header && <img className="cai-hero" src={s.cai.headerUrl} alt="" width="1200" height="240" />}
        <div className="row wrap price-head">
          <div>
            <h1 className="h1">{TITLES[type]}</h1>
            <p className="muted">{SUBS[type]}</p>
          </div>
          <span className="spacer" />
          <div className="no-print"><Tabs label="Price list" value={type} onChange={(t) => nav(`/prices/${t}`)} tabs={[{ value: 'yarn', label: 'Yarn' }, { value: 'cai', label: 'CAI' }]} /></div>
        </div>
      </Reveal>

      <div className="row wrap toolbar no-print">
        <Dropdown label="Select date" icon="cal" value={date || dates.data?.[0] || ''} options={(dates.data || []).map((x, i) => ({ value: x, label: i === 0 ? `${fmtDate(x)} (latest)` : fmtDate(x) }))}
          onChange={(v) => setSp(v === dates.data?.[0] ? {} : { date: v })} />
        <label className="search glass">
          <Icon name="search" size={18} /><span className="sr">Search items</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" />
        </label>
        <span className="spacer" />
        <div className="tabs" role="group" aria-label="View">
          <button className="tab" aria-pressed={mode === 'table'} aria-selected={mode === 'table'} onClick={() => setMode('table')}><Icon name="list" size={16} /> Table</button>
          <button className="tab" aria-pressed={mode === 'cards'} aria-selected={mode === 'cards'} onClick={() => setMode('cards')}><Icon name="grid" size={16} /> Cards</button>
        </div>
        <Button variant="glass" size="sm" icon="print" onClick={() => window.print()}>Print</Button>
        {d?.rows && <ShareButton list={d} type={type} />}
      </div>

      {d?.date && (
        <div className="row wrap meta">
          <Pill icon="cal">{fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Pill>
          {d.isToday && <Pill tone="new"><span className="dot" />Updated today</Pill>}
          <span className="muted small">Updated at {fmtDateTime(d.updatedAt)} IST</span>
        </div>
      )}

      {list.loading && !d ? <GlassCard><SkeletonRows n={8} /></GlassCard>
        : d?.empty ? <PriceEmpty />
          : rows.length === 0 ? <GlassCard className="pad"><p className="muted">No items match “{q}”.</p></GlassCard>
            : <PriceTable rows={rows} series={series.data} view={mode} caption={`${TITLES[type]} for ${d.date}`} key={`${d.date}-${mode}`} />}
      {d?.rows && mode === 'table' && <p className="muted small hint-click no-print">Tap a row to see its 30 day trend.</p>}

      {d?.poster && (
        <GlassCard className="poster no-print">
          <div className="row wrap"><h3>Official price poster</h3><span className="spacer" />
            <Button size="sm" icon="download" href={d.poster} download>{d.posterName || 'Download'}</Button></div>
          {!/\.pdf$/i.test(d.poster) && <img src={d.poster} alt="Official price poster" loading="lazy" />}
        </GlassCard>
      )}
      {type === 'yarn' && (
        <GlassCard className="pad ref-link no-print">
          <div><b>Labour, power and cotton cost charts</b><p className="muted">Reference charts the office updates when costs change.</p></div>
          <Button to="/reference" variant="glass" size="sm" arrow>Open reference</Button>
        </GlassCard>
      )}
    </div>
  );
}
export { Skeleton };
