import { useState } from 'react';
import { Button, ConfirmModal, EmptyState, GlassCard, Icon, Modal, Pill, Skeleton, Tabs, useToast } from '../ui/index.js';
import { adminApi, useFetch } from '../lib/api.js';
import { fmtDateTime, relTime } from '../lib/format.js';
import { useDebounced } from '../lib/hooks.jsx';

const TONE = { pending: 'amber', approved: 'up', blocked: 'down' };

/** Approve, block, delete and reset passwords for member accounts (the people who can see rates). */
export default function Users() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const qs = `/users?${status ? `status=${status}&` : ''}${dq ? `q=${encodeURIComponent(dq)}` : ''}`;
  const { data, loading, reload } = useFetch(qs, { admin: true });
  const { reload: reloadBadge } = useFetch('/summary', { admin: true, silent: true });
  const [del, setDel] = useState(null), [temp, setTemp] = useState(null);
  const counts = data?.counts || {};
  const act = async (fn, msg) => { try { const r = await fn(); toast.success(msg); reload(); reloadBadge(); return r; } catch (x) { toast.error(x.message); } };

  return (
    <div className="stack-lg">
      <div className="row wrap" style={{ gap: 12 }}>
        <Tabs label="Status" value={status} onChange={setStatus} tabs={[
          { value: 'pending', label: `Pending${counts.pending ? ` (${counts.pending})` : ''}` }, { value: 'approved', label: `Approved${counts.approved ? ` (${counts.approved})` : ''}` },
          { value: 'blocked', label: `Blocked${counts.blocked ? ` (${counts.blocked})` : ''}` }, { value: '', label: 'All' }]} />
        <span className="spacer" />
        <label className="search glass"><Icon name="search" size={18} /><span className="sr">Search members</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, mill" /></label>
      </div>
      {loading && !data ? <GlassCard className="pad"><Skeleton h={20} /><Skeleton h={20} style={{ marginTop: 12 }} /></GlassCard>
        : !data?.users?.length ? <GlassCard><EmptyState title="No members here" text={status === 'pending' ? 'New sign-ups waiting for approval show up here.' : 'Nothing matches this filter.'} /></GlassCard>
          : <ul className="plist">{data.users.map((u) => (
            <li key={u.id} className="glass prow">
              <div className="prow-main">
                <div className="row wrap" style={{ gap: 8 }}>
                  <Pill tone={TONE[u.status]}>{u.status}</Pill>
                  <span className="muted small">Joined {relTime(u.createdAt)}</span>
                  {u.lastLoginAt && <span className="muted small">Last sign-in {fmtDateTime(u.lastLoginAt)}</span>}
                </div>
                <b>{u.name}{u.millName ? ` · ${u.millName}` : ''}{u.city ? `, ${u.city}` : ''}</b>
                <span className="muted small">{u.email} · {u.phone}</span>
              </div>
              <div className="prow-actions">
                {u.status !== 'approved' && <Button size="sm" icon="check" onClick={() => act(() => adminApi.put(`/users/${u.id}/approve`), 'Approved')}>Approve</Button>}
                {u.status !== 'blocked' && <Button size="sm" variant="glass" onClick={() => act(() => adminApi.put(`/users/${u.id}/block`), 'Blocked')}>Block</Button>}
                <button className="icon-btn" aria-label="Reset password" title="Reset password" onClick={async () => { const r = await act(() => adminApi.post(`/users/${u.id}/reset-password`), 'Temporary password created'); if (r) setTemp({ ...r, name: u.name }); }}><Icon name="lock" /></button>
                <button className="icon-btn" aria-label="Delete" onClick={() => setDel(u)}><Icon name="trash" /></button>
              </div>
            </li>))}</ul>}
      <ConfirmModal open={!!del} danger title="Delete this member?" text={del && `${del.name} (${del.email}) will lose access and the account is removed permanently.`} confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { await act(() => adminApi.del(`/users/${del.id}`), 'Deleted'); setDel(null); }} />
      <Modal open={!!temp} onClose={() => setTemp(null)} title="Temporary password" actions={<Button onClick={() => setTemp(null)}>Done</Button>}>
        <p>Give this to {temp?.name}. It is shown only once, and they should change it after signing in.</p>
        <p className="temp-pw"><code>{temp?.password}</code></p>
        <Button variant="glass" size="sm" icon="copy" onClick={() => navigator.clipboard?.writeText(temp.password).then(() => toast.success('Copied'))}>Copy</Button>
      </Modal>
    </div>
  );
}
