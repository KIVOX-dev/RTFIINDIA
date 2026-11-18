import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, GlassCard, Icon, Pill, Reveal, Tabs } from '../ui/index.js';
import { useSeo, usePriceMeta } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';
import { fmtDateTime, fmtDate } from '../lib/format.js';

const TITLES = { yarn: 'Yarn Price List', cai: 'CAI Spot Rate' };
const SUBS = { yarn: 'Open End yarn rates from RTF member mills', cai: 'Cotton spot rates, updated daily' };

/** Public teaser for /prices/:type. Rates are members-only, so the table below is blurred sample data. */
export default function Prices() {
  const { type } = useParams();
  const nav = useNavigate();
  const { user, ready } = useUser();
  const { meta } = usePriceMeta();
  const valid = TITLES[type];
  useSeo(valid ? `${TITLES[type]} for members` : 'Prices', 'Daily yarn and CAI rates are for RTF members. Sign in to view.');
  if (!valid) return <Navigate to="/prices/yarn" replace />;
  if (ready && user) return <Navigate to={`/dashboard?tab=${type}`} replace />; // old links keep working for signed-in members
  const m = meta?.[type];
  const names = (m?.items?.length ? m.items : ['20s', '24s', '30s', '40s', '16s', '10s']).slice(0, 6);
  return (
    <div className="container page-pad section prices-page">
      <Reveal>
        <div className="row wrap price-head">
          <div>
            <h1 className="h1">{TITLES[type]}</h1>
            <p className="muted">{SUBS[type]}</p>
          </div>
          <span className="spacer" />
          <Tabs label="Price list" value={type} onChange={(t) => nav(`/prices/${t}`)} tabs={[{ value: 'yarn', label: 'Yarn' }, { value: 'cai', label: 'CAI' }]} />
        </div>
      </Reveal>

      <div className="teaser">
        <div className="teaser-table glass" aria-hidden="true">
          <table className="dt">
            <thead><tr><th>Item</th><th className="r">Rate</th><th className="r">Change</th></tr></thead>
            <tbody>
              {names.map((n, i) => (
                <tr key={n}><td><b>{n}</b></td><td className="r blur">{(1234 + i * 37).toLocaleString('en-IN')}</td><td className="r blur">+{2 + i}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <GlassCard className="teaser-cta">
          <span className="auth-ic"><Icon name="lock" size={22} /></span>
          <Pill tone="new">Members only</Pill>
          <h2 className="h2">Sign in to view today's rates</h2>
          <p className="muted">
            {m?.date ? <>Latest list: <b>{fmtDate(m.date, { day: 'numeric', month: 'long' })}</b>{m.isToday ? ' (published today)' : ''}, updated {fmtDateTime(m.updatedAt)} IST.</> : 'Rates are published every day by the RTF office.'}
          </p>
          <div className="row wrap" style={{ gap: 12 }}>
            <Button to="/login" state={{ from: `/dashboard?tab=${type}` }} size="lg">Sign in</Button>
            <Button to="/register" variant="glass" size="lg">Register free</Button>
          </div>
          <p className="muted small">Registration is free for Open End spinning mills. The office approves each account.</p>
        </GlassCard>
      </div>
    </div>
  );
}
