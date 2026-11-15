import { useEffect, useRef, useState } from 'react';
import { Button, ConfirmModal, DataTable, EmptyState, GlassCard, Icon, Input, Modal, Pill, Select, Skeleton, Textarea, useToast } from '../ui/index.js';
import { adminApi, clearCache, useFetch } from '../lib/api.js';
import { useSettings } from '../lib/hooks.jsx';
import { fmtDate, fmtDateTime, todayIST } from '../lib/format.js';
import { uploadImage } from './adminLib.js';

const CFG = {
  members: { path: 'members', title: 'Member', cols: [['name', 'Name'], ['role', 'Role'], ['firm', 'Firm'], ['group', 'Group']],
    fields: [{ k: 'group', l: 'Group', t: 'select', o: ['office', 'zonal', 'management'] }, { k: 'name', l: 'Name', req: 1 }, { k: 'role', l: 'Role' }, { k: 'firm', l: 'Firm / mill' }, { k: 'photoUrl', l: 'Photo', t: 'image' }, { k: 'linkedin', l: 'LinkedIn URL (optional)' }, { k: 'order', l: 'Order (small first)', t: 'number' }], blank: { group: 'office', order: 0 } },
  gallery: { path: 'gallery', title: 'Photo', bulk: true, cols: [['imageUrl', 'Photo', 'img'], ['alt', 'Description'], ['category', 'Section']],
    fields: [{ k: 'imageUrl', l: 'Photo', t: 'image', req: 1 }, { k: 'alt', l: 'Description (alt text)' }, { k: 'caption', l: 'Caption' }, { k: 'category', l: 'Section', t: 'select', o: ['gallery', 'about', 'grey-yarn'] }, { k: 'order', l: 'Order', t: 'number' }], blank: { category: 'gallery', order: 0 } },
  awards: { path: 'awards', title: 'Award photo', cols: [['year', 'Year'], ['title', 'Title'], ['imageUrl', 'Photo', 'img']],
    fields: [{ k: 'year', l: 'Year', t: 'number', req: 1 }, { k: 'title', l: 'Title' }, { k: 'imageUrl', l: 'Photo', t: 'image' }, { k: 'alt', l: 'Description (alt text)' }, { k: 'order', l: 'Order', t: 'number' }], blank: { year: new Date().getFullYear(), order: 0 } },
  reference: { path: 'reference', title: 'Reference chart', cols: [['title', 'Title'], ['category', 'Category'], ['date', 'Date']],
    fields: [{ k: 'title', l: 'Title', req: 1 }, { k: 'category', l: 'Category', t: 'select', o: ['Labour cost', 'Power cost', 'Cotton vs comber noils'] }, { k: 'date', l: 'Date', t: 'date', req: 1 }, { k: 'fileUrl', l: 'Chart image or PDF', t: 'file' }, { k: 'alt', l: 'Description (alt text)' },
      { k: 'table', l: 'Optional table (one row per line, columns separated by comma or tab)', t: 'table' }], blank: { category: 'Labour cost', date: todayIST() } },
};

function ImageField({ f, value, onChange, setExtra }) {
  const ref = useRef(); const [busy, setBusy] = useState(false); const toast = useToast();
  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try {
      if (file.type === 'application/pdf') { const r = await adminApi.upload(file); onChange(r.url); setExtra({ isPdf: true }); }
      else { const r = await uploadImage(file); onChange(r.url); setExtra({ w: r.w, h: r.h, isPdf: false }); }
    } catch (x) { toast.error(x.message); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <div className="photo-row">
      <input ref={ref} type="file" hidden accept={f.t === 'file' ? 'image/*,application/pdf' : 'image/*'} onChange={pick} />
      <Button variant="glass" size="sm" icon="upload" loading={busy} onClick={() => ref.current.click()}>{value ? `Change ${f.l.toLowerCase()}` : `Upload ${f.l.toLowerCase()}`}</Button>
      {value && /\.pdf$/i.test(value) ? <Pill icon="doc">PDF attached</Pill> : value && <img src={value} alt="" className="thumb" />}
    </div>
  );
}

function Collection({ cfg, onSaved }) {
  const toast = useToast();
  const { data, loading, reload } = useFetch(`/${cfg.path}`, { admin: true });
  const [edit, setEdit] = useState(null), [del, setDel] = useState(null), [busy, setBusy] = useState(false), [errs, setErrs] = useState({});
  const bulk = useRef();
  const open = (row) => { setErrs({}); setEdit(row ? { ...row, table: row.table?.map((r) => r.join('\t')).join('\n') } : { ...cfg.blank }); };
  const set = (k, v) => setEdit((o) => ({ ...o, [k]: v }));
  const save = async () => {
    const er = {};
    cfg.fields.forEach((f) => { if (f.req && !String(edit[f.k] ?? '').trim()) er[f.k] = 'Required'; });
    setErrs(er); if (Object.keys(er).length) return;
    const body = { ...edit };
    if (typeof body.table === 'string') body.table = body.table.trim() ? body.table.split('\n').map((l) => l.split(/\t|,/).map((c) => c.trim())) : [];
    setBusy(true);
    try { edit._id ? await adminApi.put(`/${cfg.path}/${edit._id}`, body) : await adminApi.post(`/${cfg.path}`, body); clearCache(); toast.success('Saved'); setEdit(null); reload(); onSaved?.(); }
    catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await adminApi.del(`/${cfg.path}/${del._id}`); clearCache(); toast.success('Deleted'); setDel(null); reload(); onSaved?.(); } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  const uploadMany = async (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) { const r = await uploadImage(file); await adminApi.post('/gallery', { imageUrl: r.url, w: r.w, h: r.h, category: 'gallery', alt: file.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' ') }); }
      clearCache(); toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added`); reload();
    } catch (x) { toast.error(x.message); } finally { setBusy(false); e.target.value = ''; }
  };
  const columns = [
    ...cfg.cols.map(([k, l, t]) => ({ key: k, label: l, render: (r) => (t === 'img' ? (r[k] ? <img src={r[k]} alt="" className="thumb" /> : '–') : r[k] || '–') })),
    { key: 'a', label: '', align: 'right', render: (r) => <span className="row" style={{ justifyContent: 'flex-end' }}><button className="icon-btn" aria-label="Edit" onClick={() => open(r)}><Icon name="edit" /></button><button className="icon-btn" aria-label="Delete" onClick={() => setDel(r)}><Icon name="trash" /></button></span> },
  ];
  return (
    <div className="stack-lg">
      <div className="row wrap" style={{ gap: 10 }}><span className="spacer" />
        {cfg.bulk && <><input ref={bulk} type="file" multiple accept="image/*" hidden onChange={uploadMany} /><Button variant="glass" icon="upload" loading={busy && !edit} onClick={() => bulk.current.click()}>Upload several photos</Button></>}
        <Button icon="plus" onClick={() => open()}>Add {cfg.title.toLowerCase()}</Button></div>
      {loading ? <GlassCard className="pad"><Skeleton h={22} /><Skeleton h={22} style={{ marginTop: 12 }} /></GlassCard>
        : !data?.length ? <GlassCard><EmptyState title={`No ${cfg.title.toLowerCase()}s yet`} text="Add the first one." /></GlassCard>
          : <DataTable rows={data} columns={columns} rowKey={(r) => r._id} />}
      <Modal open={!!edit} wide onClose={() => setEdit(null)} title={`${edit?._id ? 'Edit' : 'Add'} ${cfg.title.toLowerCase()}`}
        actions={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></>}>
        {edit && <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>{cfg.fields.map((f) => {
          if (f.t === 'image' || f.t === 'file') return <div key={f.k}><ImageField f={f} value={edit[f.k]} onChange={(v) => set(f.k, v)} setExtra={(x) => setEdit((o) => ({ ...o, ...x }))} />{errs[f.k] && <span className="msg" role="alert" style={{ color: 'var(--down-ink)' }}>{errs[f.k]}</span>}</div>;
          if (f.t === 'select') return <Select key={f.k} label={f.l} value={edit[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} options={f.o} />;
          if (f.t === 'table') return <Textarea key={f.k} label={f.l} value={edit[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} />;
          return <Input key={f.k} label={f.l} type={f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : 'text'} value={edit[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} error={errs[f.k]} />;
        })}</div>}
      </Modal>
      <ConfirmModal open={!!del} danger title="Delete this item?" text="This cannot be undone." confirmLabel="Delete" loading={busy} onClose={() => setDel(null)} onConfirm={remove} />
    </div>
  );
}

function Inbox() {
  const toast = useToast();
  const { data, loading, reload } = useFetch('/messages', { admin: true });
  const [del, setDel] = useState(null);
  const toggle = async (m) => { try { await adminApi.put(`/messages/${m._id}/read`, { read: !m.read }); reload(); } catch (x) { toast.error(x.message); } };
  if (loading && !data) return <GlassCard className="pad"><Skeleton h={22} /></GlassCard>;
  if (!data?.length) return <GlassCard><EmptyState title="No messages yet" text="Contact form messages will land here." /></GlassCard>;
  return (
    <div className="stack-lg">
      {data.map((m) => (
        <GlassCard key={m._id} className={`pad msg ${m.read ? '' : 'unread'}`}>
          <div className="row wrap"><b>{m.name}</b>{!m.read && <Pill tone="new">Unread</Pill>}<span className="muted small">{m.mill}</span><span className="spacer" /><span className="muted small">{fmtDateTime(m.createdAt)}</span></div>
          <p style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            <Button size="sm" icon="phone" href={`tel:${m.phone}`}>{m.phone}</Button>
            <Button size="sm" variant="glass" icon="whatsapp" href={`https://wa.me/${m.phone.replace(/\D/g, '')}`}>WhatsApp</Button>
            <Button size="sm" variant="ghost" onClick={() => toggle(m)}>{m.read ? 'Mark unread' : 'Mark read'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setDel(m)}>Delete</Button>
          </div>
        </GlassCard>))}
      <ConfirmModal open={!!del} danger title="Delete message?" text="This cannot be undone." confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={async () => { await adminApi.del(`/messages/${del._id}`); setDel(null); reload(); }} />
    </div>
  );
}

/* ---------- Site text (Settings) ---------- */
const ICONS = ['price', 'meet', 'free', 'award', 'news', 'community'];
const SECTIONS = [
  { key: 'site', title: 'Site', fields: [{ k: 'name', l: 'Organisation name' }, { k: 'short', l: 'Short name' }, { k: 'location', l: 'Location line' }, { k: 'logoUrl', l: 'Logo', t: 'image' }] },
  { key: 'hero', title: 'Home hero', fields: [{ k: 'tagline', l: 'Tagline (headline)' }, { k: 'sub', l: 'Sub text', t: 'area' }, { k: 'ctaLabel', l: 'Button label' }, { k: 'ctaLink', l: 'Button link' }, { k: 'points', l: 'Points under the headline (one per line)', t: 'lines' }] },
  { key: 'home', title: 'Home page blocks', fields: [{ k: 'promo.title', l: 'Promo banner title' }, { k: 'promo.text', l: 'Promo banner text', t: 'area' }, { k: 'promo.cta', l: 'Promo button label' }, { k: 'promo.link', l: 'Promo button link' }, { k: 'promo2.title', l: 'Promo slide 2 title' }, { k: 'promo2.cta', l: 'Promo slide 2 button label' }, { k: 'promo2.link', l: 'Promo slide 2 button link' }, { k: 'platform.before', l: 'Platform heading: start' }, { k: 'platform.highlight', l: 'Platform heading: green highlighted words' }, { k: 'platform.after', l: 'Platform heading: end' }] },
  { key: 'vision', title: 'Our vision', fields: [{ k: 'heading', l: 'Heading' }, { k: 'text', l: 'Paragraph', t: 'area' }] },
  { key: 'stats', title: 'Counters (stats)', list: [{ k: 'value', l: 'Number', t: 'number' }, { k: 'suffix', l: 'Suffix (e.g. + or lakh)' }, { k: 'label', l: 'Label' }] },
  { key: 'features', title: 'Why RTF cards', list: [{ k: 'icon', l: 'Icon', t: 'select', o: ICONS }, { k: 'title', l: 'Title' }, { k: 'text', l: 'Text', t: 'area' }] },
  { key: 'about', title: 'About page', fields: [{ k: 'heading', l: 'Heading' }, { k: 'intro', l: 'Intro paragraphs (one per line)', t: 'lines' }, { k: 'facts', l: 'Key facts (one per line)', t: 'lines' }, { k: 'products', l: 'Products from recycled yarn (one per line)', t: 'lines' }, { k: 'purpose', l: 'What RTF is for (one per line)', t: 'lines' }, { k: 'steps', l: 'How recycling works: one step per line, as Title | text', t: 'lines' }, { k: 'who', l: 'Who RTF serves: one per line, as Title | text', t: 'lines' }, { k: 'faq', l: 'Questions: one per line, as Question | Answer', t: 'lines' }, { k: 'membership', l: 'Membership text', t: 'area' }, { k: 'joinUrl', l: 'Join RTF WhatsApp link' }] },
  { key: 'contact', title: 'Contact details', fields: [{ k: 'address', l: 'Address', t: 'area' }, { k: 'email', l: 'Email' }, { k: 'phone', l: 'Phone' }, { k: 'whatsapp', l: 'WhatsApp number' }, { k: 'mapUrl', l: 'Map embed link (optional: leave blank to use the address above)' }] },
  { key: 'hours', title: 'Opening hours', list: [{ k: 'label', l: 'Label' }, { k: 'days', l: 'Days (0=Sun … 6=Sat, comma separated)', t: 'nums' }, { k: 'open', l: 'Opens (HH:MM, blank = closed)' }, { k: 'close', l: 'Closes (HH:MM)' }] },
  { key: 'social', title: 'Social links', fields: ['instagram', 'linkedin', 'youtube', 'facebook'].map((k) => ({ k, l: `${k[0].toUpperCase()}${k.slice(1)} URL` })) },
  { key: 'footer', title: 'Footer', fields: [{ k: 'credit', l: 'Developer credit line' }, { k: 'note', l: 'Footer note' }] },
  { key: 'categories', title: 'News categories', list: [{ k: 'name', l: 'Name' }, { k: 'color', l: 'Colour', t: 'color' }] },
  { key: 'cai', title: 'CAI page', fields: [{ k: 'headerUrl', l: 'Header image', t: 'image' }] },
];

function Field({ f, v, onChange }) {
  if (f.t === 'image') return <ImageField f={f} value={v} onChange={onChange} setExtra={() => {}} />;
  if (f.t === 'select') return <Select label={f.l} value={v ?? ''} onChange={(e) => onChange(e.target.value)} options={f.o} />;
  if (f.t === 'area') return <Textarea label={f.l} value={v ?? ''} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 90 }} />;
  if (f.t === 'lines') return <Textarea label={f.l} value={(v || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />;
  if (f.t === 'nums') return <Input label={f.l} value={(v || []).join(',')} onChange={(e) => onChange(e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x >= 0 && x <= 6 && x === Math.floor(x)))} />;
  if (f.t === 'color') return <div className="field"><input type="color" value={v || '#3395ff'} onChange={(e) => onChange(e.target.value)} aria-label={f.l} style={{ padding: 4, minHeight: 52 }} /></div>;
  if (f.t === 'number') return <Input label={f.l} type="number" value={v ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
  return <Input label={f.l} value={v ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

const setPath = (o, path, v) => (path.length === 1 ? { ...o, [path[0]]: v } : { ...o, [path[0]]: setPath(o[path[0]] || {}, path.slice(1), v) });

function Section({ def, initial, onSaved }) {
  const toast = useToast();
  const [val, setVal] = useState(initial ?? (def.list ? [] : {}));
  const [busy, setBusy] = useState(false);
  useEffect(() => setVal(initial ?? (def.list ? [] : {})), [initial]); // eslint-disable-line
  const save = async () => {
    setBusy(true);
    try {
      const v = def.list ? val.map((r) => ({ ...r, ...(r.value !== undefined ? { value: Number(r.value) || 0 } : {}) })) : { ...val, ...Object.fromEntries(Object.entries(val).filter(([, x]) => Array.isArray(x) && typeof x[0] === 'string').map(([k, x]) => [k, x.filter((l) => l.trim())])) };
      await adminApi.put(`/settings/${def.key}`, { value: v }); clearCache(); toast.success(`${def.title} saved`); onSaved?.();
    } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };
  const setItem = (i, k, v) => setVal((o) => o.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <GlassCard className="pad set-sec">
      <div className="row wrap"><h2 className="h2" style={{ fontSize: '1.25rem' }}>{def.title}</h2><span className="spacer" /><Button loading={busy} size="sm" onClick={save}>Save</Button></div>
      {def.list ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {val.map((row, i) => (
            <div key={i} className="list-row">
              {def.list.map((f) => <Field key={f.k} f={f} v={row[f.k]} onChange={(x) => setItem(i, f.k, x)} />)}
              <button className="icon-btn" aria-label="Remove" onClick={() => setVal((o) => o.filter((_, j) => j !== i))}><Icon name="trash" /></button>
            </div>))}
          <div><Button variant="glass" size="sm" icon="plus" onClick={() => setVal((o) => [...o, Object.fromEntries(def.list.map((f) => [f.k, f.t === 'number' ? 0 : f.t === 'nums' ? [] : f.t === 'color' ? '#3395ff' : '']))])}>Add</Button></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>{def.fields.map((f) => <Field key={f.k} f={f} v={f.k.split('.').reduce((a, p) => a?.[p], val)} onChange={(x) => setVal((o) => setPath(o, f.k.split('.'), x))} />)}</div>
      )}
    </GlassCard>
  );
}

function SettingsEditor({ onSaved }) {
  const { s, ready } = useSettings();
  if (!ready) return <Skeleton h={300} r={24} />;
  return <div className="stack-lg">{SECTIONS.map((d) => <Section key={d.key} def={d} initial={s[d.key]} onSaved={onSaved} />)}</div>;
}

export default function Manage({ kind, onSaved }) {
  if (kind === 'inbox') return <Inbox />;
  if (kind === 'settings') return <SettingsEditor onSaved={onSaved} />;
  return <Collection key={kind} cfg={CFG[kind]} onSaved={onSaved} />;
}
export { fmtDate };
