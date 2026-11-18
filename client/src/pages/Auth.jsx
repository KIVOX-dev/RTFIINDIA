import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, GlassCard, Icon, Input, Reveal } from '../ui/index.js';
import { userAuthApi } from '../lib/api.js';
import { useSeo } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';

function Shell({ title, lead, children, foot }) {
  return (
    <div className="container page-pad section">
      <Reveal>
        <GlassCard className="auth-card">
          <span className="auth-ic"><Icon name="lock" size={22} /></span>
          <h1 className="h2">{title}</h1>
          {lead && <p className="muted">{lead}</p>}
          {children}
          {foot && <p className="auth-foot muted small">{foot}</p>}
        </GlassCard>
      </Reveal>
    </div>
  );
}
const safeNext = (s) => (typeof s === 'string' && s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/login') ? s : '/dashboard');

export function Login() {
  useSeo('Member login', 'Sign in to view daily yarn and CAI rates.');
  const { user, login } = useUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const next = safeNext(loc.state?.from);
  if (user) return <Navigate to={next} replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, pw); nav(next, { replace: true }); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Shell title="Member login" lead="Sign in to see today's yarn and CAI rates." foot={<>New to RTF? <Link to="/register">Create a member account</Link></>}>
      <form onSubmit={submit} className="auth-form" noValidate>
        {loc.state?.from && <p className="auth-note small">Please sign in to continue.</p>}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        <Input label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required error={err} />
        <Button type="submit" size="lg" loading={busy}>Sign in</Button>
        <Link to="/forgot-password" className="muted small auth-link">Forgot your password?</Link>
      </form>
    </Shell>
  );
}

export function Register() {
  useSeo('Create member account', 'Register to view daily yarn and CAI rates.');
  const { user } = useUser();
  const [f, setF] = useState({ name: '', email: '', phone: '', millName: '', city: '', password: '' });
  const [errs, setErrs] = useState({}), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setErrs({}); setMsg(''); setBusy(true);
    try { await userAuthApi.register(f); setDone(true); } catch (x) { setErrs(x.fields || {}); setMsg(x.fields ? '' : x.message); } finally { setBusy(false); }
  };
  if (done)
    return (
      <Shell title="Thanks for registering" lead="The RTF office will review your details and approve your account. You can sign in as soon as it is approved.">
        <Button to="/" size="lg">Back to home</Button>
      </Shell>
    );
  return (
    <Shell title="Create member account" lead="Free for Open End spinning mills. The office approves each account before rates are shown." foot={<>Already registered? <Link to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="auth-form" noValidate>
        <Input label="Your name" value={f.name} onChange={set('name')} autoComplete="name" error={errs.name} required />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="email" error={errs.email} required />
        <Input label="Phone / WhatsApp" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" error={errs.phone} required />
        <div className="two">
          <Input label="Mill / firm name" value={f.millName} onChange={set('millName')} autoComplete="organization" />
          <Input label="City" value={f.city} onChange={set('city')} autoComplete="address-level2" />
        </div>
        <Input label="Password (8+ characters)" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" error={errs.password || msg} required />
        <Button type="submit" size="lg" loading={busy}>Register</Button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  useSeo('Forgot password');
  const [email, setEmail] = useState(''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await userAuthApi.forgot(email); setSent(true); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  if (sent) return <Shell title="Check your email" lead="If that email is registered, we have sent a link to choose a new password. It works for one hour."><Button to="/login" variant="glass">Back to sign in</Button></Shell>;
  return (
    <Shell title="Forgot password" lead="Enter your email and we will send you a reset link.">
      <form onSubmit={submit} className="auth-form" noValidate>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required error={err} />
        <Button type="submit" size="lg" loading={busy}>Send reset link</Button>
        <Link to="/login" className="muted small auth-link">Back to sign in</Link>
      </form>
    </Shell>
  );
}

export function Reset() {
  useSeo('Reset password');
  const { token } = useParams();
  const [pw, setPw] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await userAuthApi.reset(token, pw); setDone(true); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  if (done) return <Shell title="Password changed" lead="You can now sign in with your new password."><Button to="/login" size="lg">Sign in</Button></Shell>;
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="auth-form" noValidate>
        <Input label="New password (8+ characters)" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required error={err} />
        <Button type="submit" size="lg" loading={busy}>Save password</Button>
      </form>
    </Shell>
  );
}
