import { useState } from 'react';
import { Button, GlassCard, Input, useToast } from '../../ui/index.js';
import { memberApi } from '../../lib/api.js';
import { useUser } from '../../lib/userAuth.jsx';

export default function ProfilePanel() {
  const { user, setUser } = useUser();
  const toast = useToast();
  const [f, setF] = useState({ name: user.name, phone: user.phone, millName: user.millName, city: user.city });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false), [pwBusy, setPwBusy] = useState(false), [err, setErr] = useState(''), [pwErr, setPwErr] = useState('');
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await memberApi.put('/profile', f); setUser(r.user); toast.success('Profile saved'); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPwBusy(true); setPwErr('');
    try { await memberApi.post('/password', pw); setPw({ current: '', next: '' }); toast.success('Password changed'); } catch (x) { setPwErr(x.message); } finally { setPwBusy(false); }
  };
  return (
    <div className="profile-grid">
      <GlassCard as="form" className="pad auth-form" onSubmit={save} noValidate>
        <h3 className="h3">Your details</h3>
        <p className="muted small">{user.email}</p>
        <Input label="Name" value={f.name} onChange={set('name')} autoComplete="name" />
        <Input label="Phone / WhatsApp" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" error={err} />
        <div className="two">
          <Input label="Mill / firm" value={f.millName} onChange={set('millName')} />
          <Input label="City" value={f.city} onChange={set('city')} />
        </div>
        <Button type="submit" loading={busy}>Save details</Button>
      </GlassCard>
      <GlassCard as="form" className="pad auth-form" onSubmit={changePw} noValidate>
        <h3 className="h3">Change password</h3>
        <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw((o) => ({ ...o, current: e.target.value }))} autoComplete="current-password" />
        <Input label="New password (8+ characters)" type="password" value={pw.next} onChange={(e) => setPw((o) => ({ ...o, next: e.target.value }))} autoComplete="new-password" error={pwErr} />
        <Button type="submit" variant="glass" loading={pwBusy} disabled={!pw.current || !pw.next}>Change password</Button>
      </GlassCard>
    </div>
  );
}
