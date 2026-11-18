import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, GlassCard, Icon, Modal, Pill, Skeleton, Switch, Tabs, useToast } from '../ui/index.js';
import { PriceTable } from '../components/Prices.jsx';
import { adminApi, clearCache } from '../lib/api.js';
import { fmtDate, num, todayIST, delta } from '../lib/format.js';

const parseNum = (v) => { const n = Number(String(v).replace(/[₹,\s]/g, '')); return String(v).trim() === '' || !Number.isFinite(n) ? null : n; };

export default function PriceEditor() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const type = sp.get('type') === 'cai' ? 'cai' : 'yarn';
  const [date, setDate] = useState(todayIST());
  const [rows, setRows] = useState([]);
  const [orig, setOrig] = useState([]);
  const [poster, setPoster] = useState({ url: '', name: '' });
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [confirm, setConfirm] = useState(false);
  const [alertOn, setAlertOn] = useState(true);
  const refs = useRef({});
  const fileRef = useRef(), posterRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { doc, base } = await adminApi.get(`/prices/${type}/${date}`);
      if (doc) { setRows(doc.rows.map((r) => ({ ...r }))); setOrig(doc.rows); setPoster({ url: doc.poster || '', name: doc.posterName || '' }); setInfo(`Editing the list already published for ${fmtDate(date)}.`); }
      else if (base) { setRows(base.rows.map((r) => ({ item: r.item, unit: r.unit, note: '', rate: r.rate, prev: r.rate }))); setOrig(base.rows); setPoster({ url: '', name: '' }); setInfo(`New list for ${fmtDate(date)}, started from ${fmtDate(base.date)}. Change the rates that moved.`); }
      else { setRows([{ item: '', unit: type === 'yarn' ? '₹/kg' : '₹/candy', rate: '', prev: null, note: '' }]); setOrig([]); setPoster({ url: '', name: '' }); setInfo('First list. Add your items, or import an Excel file.'); }
    } catch (x) { toast.error(x.message); } finally { setLoading(false); }
  }, [type, date]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const upd = (i, k, v) => setRows((o) => o.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const focus = (i, c) => refs.current[`${i}-${c}`]?.focus();
  const onKey = (e, i, c) => { if (e.key === 'Enter') { e.preventDefault(); if (i === rows.length - 1 && c === 'rate') addRow(); setTimeout(() => focus(i + 1, c), 0); } };
  const addRow = () => setRows((o) => [...o, { item: '', unit: o[o.length - 1]?.unit || '', rate: '', prev: null, note: '' }]);
  const onPaste = (e, i, c) => {
    const t = e.clipboardData.getData('text');
    if (!/[\n\t]/.test(t.trim())) return;
    e.preventDefault();
    const lines = t.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
    setRows((o) => {
      const next = o.map((r) => ({ ...r }));
      lines.forEach((line, k) => {
        const cells = line.split('\t');
        const idx = i + k;
        while (next.length <= idx) next.push({ item: '', unit: next[next.length - 1]?.unit || '', rate: '', prev: null, note: '' });
        if (c === 'rate') { const v = parseNum(cells[cells.length - 1]); if (v != null) next[idx].rate = v; }
        else { next[idx].item = cells[0].trim(); if (cells[1] != null) next[idx].unit = cells[1].trim(); if (cells[2] != null) { const v = parseNum(cells[2]); if (v != null) next[idx].rate = v; } }
      });
      return next;
    });
    toast.info(`Pasted ${lines.length} row${lines.length > 1 ? 's' : ''}`);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const f = new FormData(); f.append('file', file);
    try {
      const { rows: imp } = await adminApi.post('/prices-import', f);
      const prevMap = new Map(orig.map((r) => [r.item, r.rate]));
      setRows(imp.map((r) => ({ ...r, prev: prevMap.has(r.item) ? prevMap.get(r.item) : null })));
      toast.success(`Imported ${imp.length} rows. Review, then save.`);
    } catch (x) { toast.error(x.message); } finally { e.target.value = ''; }
  };
  const uploadPoster = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { const r = await adminApi.upload(file); setPoster({ url: r.url, name: r.name }); } catch (x) { toast.error(x.message); } finally { e.target.value = ''; }
  };

  const clean = useMemo(() => rows.filter((r) => r.item.trim()).map((r) => ({ ...r, rate: parseNum(r.rate), prev: r.prev == null ? null : Number(r.prev) })), [rows]);
  const diff = useMemo(() => {
    const m = new Map(orig.map((r) => [r.item, r.rate]));
    const out = { changed: [], same: [], added: [] };
    clean.forEach((r) => (!m.has(r.item) ? out.added : m.get(r.item) !== r.rate ? out.changed : out.same).push({ ...r, was: m.get(r.item) }));
    return out;
  }, [clean, orig]);

  const openConfirm = () => {
    const bad = rows.some((r) => r.item.trim() && parseNum(r.rate) == null);
    if (!clean.length) return toast.error('Add at least one item.');
    if (bad) return toast.error('Some items have no rate. Fill or remove them.');
    setConfirm(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/prices/${type}/${date}`, { rows: clean, poster: poster.url, posterName: poster.name, alert: alertOn ? { create: true } : undefined });
      clearCache(); toast.success('Rates published'); setConfirm(false); load();
    } catch (x) { toast.error(x.message); } finally { setSaving(false); }
  };

  return (
    <div className="stack-lg">
      <div className="row wrap" style={{ gap: 12 }}>
        <Tabs label="List" value={type} onChange={(v) => setSp({ type: v })} tabs={[{ value: 'yarn', label: 'Yarn price list' }, { value: 'cai', label: 'CAI spot rate' }]} />
        <label className="search glass datef"><span className="sr">Date</span><input type="date" value={date} max={todayIST()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        <span className="spacer" />
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={importFile} />
        <Button variant="glass" size="sm" icon="upload" onClick={() => fileRef.current.click()}>Import Excel / CSV</Button>
      </div>
      <p className="muted">{loading ? 'Loading…' : info}</p>
      <div className="editor">
        <GlassCard className="grid-wrap">
          {loading ? <div style={{ padding: 20, display: 'grid', gap: 12 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={40} />)}</div> : (
            <table className="xl">
              <thead><tr><th>Item</th><th>Unit</th><th className="r">Rate</th><th className="r">Prev</th><th className="r">Change</th><th>Note</th><th /></tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const rate = parseNum(r.rate); const d = rate != null && r.prev != null ? Math.round((rate - r.prev) * 100) / 100 : null;
                  return (
                    <tr key={i} className={d ? (d > 0 ? 'ch-up' : 'ch-down') : ''}>
                      <td><input aria-label={`Item ${i + 1}`} ref={(el) => (refs.current[`${i}-item`] = el)} value={r.item} onChange={(e) => upd(i, 'item', e.target.value)} onKeyDown={(e) => onKey(e, i, 'item')} onPaste={(e) => onPaste(e, i, 'item')} /></td>
                      <td><input aria-label="Unit" className="narrow" value={r.unit} onChange={(e) => upd(i, 'unit', e.target.value)} /></td>
                      <td><input aria-label={`Rate for ${r.item || i + 1}`} inputMode="decimal" className="r rate-in" ref={(el) => (refs.current[`${i}-rate`] = el)} value={r.rate ?? ''} onChange={(e) => upd(i, 'rate', e.target.value)} onKeyDown={(e) => onKey(e, i, 'rate')} onPaste={(e) => onPaste(e, i, 'rate')} onFocus={(e) => e.target.select()} /></td>
                      <td className="r muted">{r.prev == null ? '–' : num(r.prev)}</td>
                      <td className="r">{d == null ? '' : <span className={`chg ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}`}>{d > 0 ? '+' : ''}{num(d)}</span>}</td>
                      <td><input aria-label="Note" value={r.note} onChange={(e) => upd(i, 'note', e.target.value)} /></td>
                      <td><button className="icon-btn" aria-label={`Remove row ${i + 1}`} onClick={() => setRows((o) => o.filter((_, j) => j !== i))}><Icon name="close" size={16} /></button></td>
                    </tr>);
                })}
              </tbody>
            </table>)}
          <div className="row wrap grid-foot">
            <Button variant="glass" size="sm" icon="plus" onClick={addRow}>Add row</Button>
            <span className="muted small">Enter moves down, Tab moves across. Paste a column from Excel into Rate.</span>
          </div>
          <div className="row wrap grid-foot">
            <input ref={posterRef} type="file" accept="image/*,application/pdf" hidden onChange={uploadPoster} />
            <Button variant="ghost" size="sm" icon="doc" onClick={() => posterRef.current.click()}>{poster.url ? 'Replace poster / PDF' : 'Attach official poster / PDF'}</Button>
            {poster.url && <><Pill icon="check">{poster.name || 'Attached'}</Pill><Button variant="ghost" size="sm" onClick={() => setPoster({ url: '', name: '' })}>Remove</Button></>}
          </div>
        </GlassCard>
        <div className="preview-col sticky">
          <span className="eyebrow">Live preview (public table)</span>
          {clean.length ? <PriceTable rows={clean} animate={false} /> : <GlassCard className="pad muted">Add items to see the preview.</GlassCard>}
        </div>
      </div>
      <div className="savebar glass"><span className="muted small">{diff.changed.length} changed · {diff.added.length} new · {diff.same.length} unchanged</span><span className="spacer" /><Button size="lg" onClick={openConfirm} disabled={loading}>Review and publish</Button></div>

      <Modal open={confirm} wide onClose={() => setConfirm(false)} title={`Publish ${type === 'yarn' ? 'yarn' : 'CAI'} rates for ${fmtDate(date)}?`}
        actions={<><Button variant="ghost" onClick={() => setConfirm(false)}>Back</Button><Button loading={saving} onClick={save}>Publish now</Button></>}>
        <div className="diff">
          <div><Pill tone="up">{diff.changed.length} changed</Pill><ul>{diff.changed.map((r) => <li key={r.item}><b>{r.item}</b> {num(r.was)} → <b>{num(r.rate)}</b></li>)}</ul></div>
          <div><Pill>{diff.added.length} new</Pill><ul>{diff.added.map((r) => <li key={r.item}><b>{r.item}</b> {num(r.rate)}</li>)}</ul></div>
          <div><Pill tone="flat">{diff.same.length} unchanged</Pill><p className="muted small">{diff.same.map((r) => r.item).join(', ') || '–'}</p></div>
        </div>
        <div className="alert-box">
          <Switch label="Also post a public Price alert card (no rates)" checked={alertOn} onChange={setAlertOn} />
          {alertOn && (
            <div className="alert-preview">
              <b>{type === 'yarn' ? 'Yarn' : 'CAI'} prices updated for {fmtDate(date, { day: 'numeric', month: 'short' })}</b>
              <p>Today's {type === 'yarn' ? 'yarn' : 'CAI'} prices are published. Sign in to view.</p>
              <span className="muted small">Rates are for members only, so this public card never contains any figures. It links to the member dashboard.</span>
            </div>)}
        </div>
      </Modal>
    </div>
  );
}
