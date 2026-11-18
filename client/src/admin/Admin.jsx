import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate, Link } from 'react-router-dom';
import { Button, Dropdown, GlassCard, GlassPanes, Icon, Input, Logo, Modal, Pill, Skeleton, useToast } from '../ui/index.js';
import { adminApi, auth, useFetch } from '../lib/api.js';
import { fmtDate, fmtDateTime, todayIST } from '../lib/format.js';
import { PostComposer, PostsPage as Posts } from './Posts.jsx';
import './admin.css';

const PriceEditor = lazy(() => import('./PriceEditor.jsx'));
const Manage = lazy(() => import('./Manage.jsx'));
const Users = lazy(() => import('./Users.jsx'));

const NAV = [
  ['/admin', 'Dashboard', 'dash', true], ['/admin/prices', 'Prices', 'price'], ['/admin/news', 'News', 'news'], ['/admin/posts', 'Blog & Events', 'doc'],
  ['/admin/reference', 'Reference', 'ref'], ['/admin/users', 'Member accounts', 'users'], ['/admin/members', 'Committee', 'community'], ['/admin/gallery', 'Gallery', 'image'], ['/admin/awards', 'Awards', 'award'],
  ['/admin/inbox', 'Inbox', 'inbox'], ['/admin/settings', 'Site text', 'cog'],
];

function Login({ onLogin }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await adminApi.login(email, pw); onLogin(r.token); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-art">
        <GlassPanes />
        <Logo size={76} />
        <div className="la-bottom">
          <h1>Update today's rates in minutes and keep every RTF member informed.</h1>
          <div className="login-pts"><span><Icon name="plus" size={16} />Daily price lists</span><span><Icon name="plus" size={16} />Quick news cards</span><span><Icon name="plus" size={16} />WhatsApp sharing</span></div>
        </div>
      </div>
      <div className="login-form">
        <GlassCard as="form" className="login-card" onSubmit={submit}>
          <h2>Admin sign in</h2>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <Input label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required error={err} />
          <Button type="submit" size="lg" loading={busy}>Sign in</Button>
          <Link to="/" className="muted small" style={{ textAlign: 'center' }}>Back to website</Link>
        </GlassCard>
      </div>
    </div>
  );
}

function PasswordModal({ open, onClose }) {
  const toast = useToast();
  const [cur, setCur] = useState(''), [nw, setNw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setErr('');
    try { await adminApi.password(cur, nw); toast.success('Password changed'); setCur(''); setNw(''); onClose(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Change password" actions={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></>}>
      <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
        <Input label="Current password" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <Input label="New password (8+ characters)" type="password" value={nw} onChange={(e) => setNw(e.target.value)} error={err} />
      </div>
    </Modal>
  );
}

function AiStatus() {
  const { data } = useFetch('/ai/status', { admin: true, silent: true });
  if (!data) return null;
  const live = data.keys.filter((k) => !k.disabled && !k.cooldownUntil).length;
  return (
    <GlassCard className="pad ai-status">
      <div className="row wrap" style={{ gap: 10 }}>
        <Icon name="sparkle" size={18} /><b>AI assistant</b>
        <Pill tone={!data.configured ? 'amber' : live ? 'up' : 'down'}>{!data.configured ? 'No keys set' : `${live} of ${data.keys.length} keys ready`}</Pill>
        <span className="muted small">{data.models.join(' → ')}</span>
      </div>
      {data.keys.length > 0 && (
        <ul className="ai-keys">{data.keys.map((k) => (
          <li key={k.slot}><code>{k.key}</code>
            <Pill tone={k.disabled ? 'down' : k.cooldownUntil ? 'amber' : 'up'}>{k.disabled ? 'disabled' : k.cooldownUntil ? `cooling until ${fmtDateTime(k.cooldownUntil)}` : 'ready'}</Pill>
            <span className="muted small">{k.requests} calls, {k.failures} failed{k.lastError ? ` (${k.lastError})` : ''}</span></li>))}</ul>)}
    </GlassCard>
  );
}

export function Dashboard() {
  const { data: sum, loading } = useFetch('/summary', { admin: true });
  const Stat = ({ label, ok, text, sub, to }) => (
    <GlassCard as={to ? Link : 'div'} to={to} className="stat">
      <span className="muted small">{label}</span>
      {loading ? <Skeleton h={28} w="60%" /> : <b className="stat-v">{ok != null && <Pill tone={ok ? 'up' : 'amber'}>{ok ? 'Published' : 'Not yet'}</Pill>}{text}</b>}
      {sub && <span className="muted small">{sub}</span>}
    </GlassCard>
  );
  return (
    <div className="stack-lg">
      <div className="stats">
        <Stat label="Yarn list today" ok={sum?.yarn.publishedToday} sub={sum?.yarn.updatedAt && `Last: ${fmtDateTime(sum.yarn.updatedAt)}`} to="/admin/prices" />
        <Stat label="CAI spot rate today" ok={sum?.cai.publishedToday} sub={sum?.cai.updatedAt && `Last: ${fmtDateTime(sum.cai.updatedAt)}`} to="/admin/prices?type=cai" />
        <Stat label="News cards" text={sum?.posts} sub={sum?.scheduled ? `${sum.scheduled} scheduled` : 'None scheduled'} to="/admin/news" />
        <Stat label="Unread messages" text={sum?.unread} to="/admin/inbox" />
        <Stat label="Members awaiting approval" text={sum?.pendingUsers} sub="Approve to let them view rates" to="/admin/users" />
      </div>
      <AiStatus />
      <GlassCard className="cta-admin"><div><h2>Update today's rates</h2><p className="muted">Start from yesterday's list, change what moved, and publish.</p></div><Button to="/admin/prices" size="lg" arrow>Update rates</Button></GlassCard>
      <div><h2 className="h2" style={{ marginBottom: 12 }}>Quick post</h2><PostComposer kind="news" compact /></div>
    </div>
  );
}

function Shell({ onLogout }) {
  const loc = useLocation(), nav = useNavigate();
  const { reload } = useSettingsReload();
  const [pw, setPw] = useState(false);
  const { data: sum } = useFetch('/summary', { admin: true, silent: true });
  const title = NAV.find(([p, , , end]) => (end ? loc.pathname === p : loc.pathname.startsWith(p)))?.[1] || 'Admin';
  useEffect(() => { document.title = `${title} | RTF Admin`; }, [title]);
  return (
    <div className="adm">
      <aside className="side" aria-label="Admin">
        <Link to="/admin" className="side-brand"><Logo size={30} light /><span>RTF Admin</span></Link>
        <nav>{NAV.map(([to, label, icon, end]) => (
          <NavLink key={to} to={to} end={end} className="side-link"><Icon name={icon} /><span>{label}</span>{label === 'Inbox' && sum?.unread > 0 && <i className="badge">{sum.unread}</i>}{label === 'Member accounts' && sum?.pendingUsers > 0 && <i className="badge">{sum.pendingUsers}</i>}</NavLink>))}</nav>
        <a className="side-link side-site" href="/" target="_blank" rel="noopener noreferrer"><Icon name="eye" /><span>View website</span></a>
      </aside>
      <div className="adm-main">
        <header className="topbar">
          <h1>{title}</h1><span className="spacer" />
          <span className="muted small hide-s"><Icon name="cal" size={16} /> {fmtDate(todayIST(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} IST</span>
          <Dropdown label="Account" align="right" value="" onChange={(v) => (v === 'pw' ? setPw(true) : (auth.clear(), onLogout()))} buttonClass="avatar-btn"
            options={[{ value: 'pw', label: 'Change password' }, { value: 'out', label: 'Log out' }]} icon="users" />
        </header>
        <main className="adm-body">
          <Suspense fallback={<Skeleton h={300} r={24} />}>
            <Routes>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/prices" element={<PriceEditor />} />
              <Route path="/admin/news" element={<Posts kind="news" />} />
              <Route path="/admin/posts" element={<Posts kind="blog" multi />} />
              <Route path="/admin/reference" element={<Manage kind="reference" onSaved={reload} />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/members" element={<Manage kind="members" onSaved={reload} />} />
              <Route path="/admin/gallery" element={<Manage kind="gallery" onSaved={reload} />} />
              <Route path="/admin/awards" element={<Manage kind="awards" onSaved={reload} />} />
              <Route path="/admin/inbox" element={<Manage kind="inbox" />} />
              <Route path="/admin/settings" element={<Manage kind="settings" onSaved={reload} />} />
              <Route path="/admin/*" element={<GlassCard className="pad">Page not found. <Button variant="ghost" onClick={() => nav('/admin')}>Back to dashboard</Button></GlassCard>} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <PasswordModal open={pw} onClose={() => setPw(false)} />
    </div>
  );
}
import { useSettings } from '../lib/hooks.jsx';
const useSettingsReload = () => useSettings();

export default function Admin() {
  const [token, setToken] = useState(auth.get());
  useEffect(() => { const f = () => setToken(null); window.addEventListener('rtf-auth-lost', f); return () => window.removeEventListener('rtf-auth-lost', f); }, []);
  if (!token) return <Login onLogin={(t) => { auth.set(t); setToken(t); }} />;
  return <Shell onLogout={() => setToken(null)} />;
}
