import { useEffect, useRef, useState } from 'react';
import { Button, ConfirmModal, Dropdown, EmptyState, GlassCard, Icon, Input, Pill, Select, Switch, Tabs, Textarea, useToast, Skeleton } from '../ui/index.js';
import { NewsCard } from '../components/Cards.jsx';
import { adminApi, useFetch, clearCache } from '../lib/api.js';
import { useSettings, catColor } from '../lib/hooks.jsx';
import { fmtDateTime, waLink } from '../lib/format.js';
import { uploadImage, toLocalInput } from './adminLib.js';

const blank = (kind, cat) => ({ kind, title: '', summary: '', body: '', category: cat, pinned: false, imageUrl: '', imageAlt: '', linkUrl: '', attachmentUrl: '', eventDate: '', when: 'now', publishAt: '' });

export function PostComposer({ kind = 'news', initial, onSaved, onCancel, compact }) {
  const { s } = useSettings();
  const toast = useToast();
  const cats = (s.categories || []).map((c) => c.name);
  const [f, setF] = useState(() => (initial ? { ...blank(kind, cats[0] || ''), ...initial, when: new Date(initial.publishAt) > new Date() ? 'later' : 'now', publishAt: toLocalInput(initial.publishAt) } : blank(kind, '')));
  const [busy, setBusy] = useState(false), [up, setUp] = useState(false), [errs, setErrs] = useState({}), [full, setFull] = useState(kind !== 'news' || !!initial?.body);
  const [drafting, setDrafting] = useState(false);
  const fileRef = useRef(), pdfRef = useRef();
  const draft = async () => {
    if (f.body.trim() && !window.confirm('Replace the current full text with an AI draft?')) return;
    setDrafting(true);
    try {
      const r = await adminApi.post('/ai/draft', { kind, title: f.title, notes: f.summary });
      setF((o) => ({ ...o, summary: o.summary.trim() ? o.summary : r.summary, body: r.body }));
      setFull(true);
      toast.info('Draft added. Please read and edit it before you publish.');
    } catch (x) { toast.error(x.message); } finally { setDrafting(false); }
  };
  useEffect(() => { if (!f.category && cats[0]) setF((o) => ({ ...o, category: cats[0] })); }, [cats.length]); // eslint-disable-line
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const pickImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUp(true);
    try { const r = await uploadImage(file); setF((o) => ({ ...o, imageUrl: r.url })); } catch (x) { toast.error(x.message); } finally { setUp(false); e.target.value = ''; }
  };
  const pickPdf = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUp(true);
    try { const r = await adminApi.upload(file); setF((o) => ({ ...o, attachmentUrl: r.url })); } catch (x) { toast.error(x.message); } finally { setUp(false); e.target.value = ''; }
  };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Add a headline';
    if (f.when === 'later' && !f.publishAt) er.publishAt = 'Pick a date and time';
    if (f.imageUrl && !f.imageAlt.trim()) er.imageAlt = 'Add a short description of the photo';
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const body = { ...f, publishAt: f.when === 'later' ? new Date(f.publishAt).toISOString() : initial ? undefined : new Date().toISOString() };
    delete body.when;
    try {
      initial ? await adminApi.put(`/posts/${initial._id}`, body) : await adminApi.post('/posts', body);
      clearCache();
      toast.success(initial ? 'Changes saved' : f.when === 'later' ? 'Scheduled' : 'Published');
      if (!initial) setF(blank(kind, f.category));
      onSaved?.();
    } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  const preview = { ...f, publishAt: f.when === 'later' && f.publishAt ? new Date(f.publishAt) : new Date(), hasBody: !!f.body };
  return (
    <form className={`composer ${compact ? 'compact' : ''}`} onSubmit={submit} noValidate>
      <GlassCard className="pad fields">
        <Input label="Headline" value={f.title} onChange={set('title')} maxLength={90} error={errs.title} hint={`${f.title.length} / 90`} />
        <Textarea label="Short text" value={f.summary} onChange={set('summary')} maxLength={280} hint={`${f.summary.length} / 280`} style={{ minHeight: 90 }} />
        {!compact && (
          <div className="photo-row">
            <Button variant="glass" size="sm" icon="sparkle" loading={drafting} disabled={!f.title.trim() && !f.summary.trim()} onClick={draft}>Draft with AI</Button>
            <span className="muted small">Writes the full text from your headline and short text. Always review before publishing.</span>
          </div>)}
        <div className="two">
          <Select label="Category" value={f.category} onChange={set('category')} options={cats} />
          {kind === 'event' && <Input label="Event date (text)" value={f.eventDate} onChange={set('eventDate')} />}
        </div>
        <div className="photo-row">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <Button variant="glass" size="sm" icon="image" loading={up} onClick={() => fileRef.current.click()}>{f.imageUrl ? 'Change photo' : 'Add photo'}</Button>
          {f.imageUrl && <><img src={f.imageUrl} alt="" className="thumb" /><Button variant="ghost" size="sm" onClick={() => setF((o) => ({ ...o, imageUrl: '', imageAlt: '' }))}>Remove</Button></>}
          <span className="muted small">Resized to 1600px and saved as WebP</span>
        </div>
        {f.imageUrl && <Input label="Photo description (alt text)" value={f.imageAlt} onChange={set('imageAlt')} error={errs.imageAlt} maxLength={160} />}
        {!compact && <>
          {kind === 'news' && <Switch label="Add full article text" checked={full} onChange={setFull} />}
          {full && <Textarea label="Full text (optional for news)" value={f.body} onChange={set('body')} style={{ minHeight: 180 }} />}
          <div className="two">
            <Input label="Link (optional)" value={f.linkUrl} onChange={set('linkUrl')} />
            <div className="photo-row">
              <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={pickPdf} />
              <Button variant="glass" size="sm" icon="doc" onClick={() => pdfRef.current.click()}>{f.attachmentUrl ? 'PDF attached' : 'Attach PDF'}</Button>
              {f.attachmentUrl && <Button variant="ghost" size="sm" onClick={() => setF((o) => ({ ...o, attachmentUrl: '' }))}>Remove</Button>}
            </div>
          </div>
          <Switch label="Pin to top" checked={f.pinned} onChange={(v) => setF((o) => ({ ...o, pinned: v }))} />
        </>}
        <div className="two">
          <Tabs label="When" value={f.when} onChange={(v) => setF((o) => ({ ...o, when: v }))} tabs={[{ value: 'now', label: initial ? 'Keep time' : 'Publish now' }, { value: 'later', label: 'Schedule' }]} />
          {f.when === 'later' && <Input type="datetime-local" label="Publish at" value={f.publishAt} onChange={set('publishAt')} error={errs.publishAt} />}
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Button type="submit" loading={busy} size="lg">{initial ? 'Save changes' : f.when === 'later' ? 'Schedule' : 'Publish'}</Button>
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          {f.title && <Button variant="glass" icon="whatsapp" href={waLink(`${f.title}\n${f.summary}`)}>Post to WhatsApp</Button>}
        </div>
      </GlassCard>
      <div className="preview-col"><span className="eyebrow">Live preview</span><NewsCard post={preview} preview /></div>
    </form>
  );
}

export function PostsPage({ kind: k0 = 'news', multi }) {
  const { s } = useSettings();
  const toast = useToast();
  const [kind, setKind] = useState(k0);
  const [cat, setCat] = useState(''), [date, setDate] = useState(''), [edit, setEdit] = useState(null), [del, setDel] = useState(null);
  const qs = `/posts?kind=${kind}${cat ? `&category=${encodeURIComponent(cat)}` : ''}${date ? `&date=${date}` : ''}`;
  const { data, loading, reload } = useFetch(qs, { admin: true });
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); clearCache(); reload(); } catch (x) { toast.error(x.message); } };
  const label = { news: 'news card', blog: 'blog post', event: 'event' }[kind];
  return (
    <div className="stack-lg">
      {multi && <Tabs label="Type" value={kind} onChange={(v) => { setKind(v); setEdit(null); }} tabs={[{ value: 'blog', label: 'Blog' }, { value: 'event', label: 'Events' }]} />}
      {edit ? <PostComposer key={edit._id || 'new'} kind={kind} initial={edit._id ? edit : undefined} onCancel={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />
        : <PostComposer kind={kind} onSaved={reload} />}
      <div className="row wrap" style={{ gap: 12 }}>
        <h2 className="h2">All {kind === 'event' ? 'events' : kind === 'blog' ? 'blog posts' : 'news cards'}</h2><span className="spacer" />
        <Dropdown label="Category" value={cat} onChange={setCat} options={[{ value: '', label: 'All categories' }, ...(s.categories || []).map((c) => ({ value: c.name, label: c.name }))]} />
        <label className="search glass datef"><span className="sr">Filter by date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      {loading && !data ? <GlassCard className="pad"><Skeleton h={20} /><Skeleton h={20} style={{ marginTop: 12 }} /></GlassCard>
        : !data?.length ? <GlassCard><EmptyState title={`No ${label}s yet`} text="Anything you publish above shows up here." /></GlassCard>
          : <ul className="plist">{data.map((p) => (
            <li key={p._id} className="glass prow">
              <div className="prow-main">
                <div className="row wrap" style={{ gap: 8 }}>
                  {p.category && <Pill color={catColor(s, p.category)}>{p.category}</Pill>}
                  <Pill tone={p.status === 'live' ? 'up' : p.status === 'scheduled' ? 'amber' : 'flat'}>{p.status}</Pill>
                  {p.pinned && <Pill icon="pin">Pinned</Pill>}
                  <span className="muted small">{fmtDateTime(p.publishAt)}</span>
                  {p.views > 0 && <span className="muted small"><Icon name="eye" size={14} /> {p.views}</span>}
                </div>
                <b>{p.title}</b>
              </div>
              <div className="prow-actions">
                <button className="icon-btn" aria-label="Edit" onClick={() => { setEdit(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Icon name="edit" /></button>
                <button className="icon-btn" aria-label={p.pinned ? 'Unpin' : 'Pin'} onClick={() => act(() => adminApi.post(`/posts/${p._id}/pin`), p.pinned ? 'Unpinned' : 'Pinned')}><Icon name="pin" /></button>
                <button className="icon-btn" aria-label={p.hidden ? 'Show' : 'Hide'} onClick={() => act(() => adminApi.put(`/posts/${p._id}`, { hidden: !p.hidden }), p.hidden ? 'Visible again' : 'Hidden')}><Icon name="eye" /></button>
                <button className="icon-btn" aria-label="Duplicate" onClick={() => act(() => adminApi.post(`/posts/${p._id}/duplicate`), 'Duplicated as hidden draft')}><Icon name="copyplus" /></button>
                <button className="icon-btn" aria-label="Delete" onClick={() => setDel(p)}><Icon name="trash" /></button>
              </div>
            </li>))}</ul>}
      <ConfirmModal open={!!del} danger title="Delete this post?" text={del && `“${del.title}” will be removed permanently.`} confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { await act(() => adminApi.del(`/posts/${del._id}`), 'Deleted'); setDel(null); }} />
    </div>
  );
}
