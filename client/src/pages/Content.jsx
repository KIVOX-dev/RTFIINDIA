import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Button, EmptyState, GlassCard, Icon, Input, Lightbox, Pill, Reveal, Select, Skeleton, Tabs, Textarea, useToast, DataTable } from '../ui/index.js';
import { Counters, CtaBand, TeamSection } from './Home.jsx';
import { CopyButton } from '../components/Cards.jsx';
import Spot from '../components/Spot.jsx';
import { ErrorCard } from '../components/Shell.jsx';
import { api, useFetch } from '../lib/api.js';
import { useSettings, useSeo } from '../lib/hooks.jsx';
import { fmtDate, openNow, to12h, waLink } from '../lib/format.js';

const HEAD_PHOTO = { 'About RTF': 'mill-hall-green', Gallery: 'cotton-team', Awards: 'mill-supervisors', Reference: 'quality-lab', Contact: 'export-container', Members: 'mill-spinning-frames' };
const Head = ({ eyebrow, title, lead }) => (
  <header className="page-hero">
    <img src={`/photos/${HEAD_PHOTO[eyebrow] || 'mill-corridor'}.webp`} alt="" aria-hidden="true" loading="eager" />
    <div className="page-hero-in"><span className="eyebrow">{eyebrow}</span><h1 className="h1">{title}</h1>{lead && <p className="lead-sm">{lead}</p>}</div>
  </header>
);

const STEP_IMG = ['sorting-denim', 'shredding-line', 'cones-sage', 'design-swatches'];
const WHO_IMG = ['mill-spinning-frames', 'mill-corridor', 'couple-yarn', 'cones-concrete'];
const pair = (line) => { const i = line.indexOf('|'); return i < 0 ? [line.trim(), ''] : [line.slice(0, i).trim(), line.slice(i + 1).trim()]; };

/** Steps, audience and FAQ: all text comes from Settings > About page (one "Title | text" per line). */
function AboutMore({ a }) {
  const [open, setOpen] = useState(0);
  const steps = (a.steps || []).map(pair), who = (a.who || []).map(pair), faq = (a.faq || []).map(pair);
  return (
    <>
      {steps.length > 0 && (
        <section className="block">
          <h2 className="h2">How recycling works</h2>
          <ol className="steps">
            {steps.map(([t, d], i) => <li key={t} className="step"><div className="card-ph"><img src={`/photos/${STEP_IMG[i % STEP_IMG.length]}.webp`} alt="" loading="lazy" /></div><div className="card-body"><div className="spot-row"><Spot name={['waste', 'recycle', 'yarn', 'spool'][i % 4]} /><h3>{t}</h3></div><p className="muted">{d}</p></div></li>)}
          </ol>
        </section>)}
      {who.length > 0 && (
        <section className="block">
          <h2 className="h2">Who RTF serves</h2>
          <div className="who">
            {who.map(([t, d], i) => (
              <div key={t} className="who-card"><div className="card-ph"><img src={`/photos/${WHO_IMG[i % WHO_IMG.length]}.webp`} alt="" loading="lazy" /></div><div className="card-body"><div className="spot-row"><Spot name={['mill', 'powerloom', 'handloom', 'spool'][i % 4]} /><h3>{t}</h3></div><p className="muted">{d}</p></div></div>))}
          </div>
        </section>)}
      {faq.length > 0 && (
        <section className="block faq-wrap">
          <h2 className="h2">Questions members ask</h2>
          <div className="faq">
            {faq.map(([q, ans], i) => (
              <div key={q} className={`faq-i ${open === i ? 'open' : ''}`}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name={open === i ? 'close' : 'plus'} size={18} /></button>
                {open === i && <p className="muted">{ans}</p>}
              </div>))}
          </div>
        </section>)}
    </>
  );
}

export function About() {
  const { s } = useSettings();
  useSeo('About RTF', s.about?.intro?.[0]);
  const a = s.about || {};
  const photos = useFetch('/gallery?category=about');
  const { hash } = useLocation();
  // /about#team lands on the committee section once the page has settled
  useEffect(() => {
    if (!hash) return undefined;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
    return () => clearTimeout(t);
  }, [hash]);
  return (
    <div className="container page-pad section">
      <Head eyebrow="About RTF" title={a.heading} />
      <div className="about-grid">
        <Reveal className="prose">{(a.intro || []).map((t) => <p key={t}>{t}</p>)}{(a.facts || []).map((t) => <p key={t}>{t}</p>)}</Reveal>
        <Reveal i={1}>
          {s.site?.logoUrl && <img className="about-logo" src={s.site.logoUrl} alt={s.site.name} />}
          <GlassCard className="pad"><h3>What RTF is for</h3><ul className="ticks">{(a.purpose || []).map((t) => <li key={t}><Icon name="check" size={18} />{t}</li>)}</ul></GlassCard>
        </Reveal>
      </div>
      <Counters />
      {a.products?.length > 0 && (
        <Reveal className="block"><div className="prod-split"><div className="card-ph prod-ph"><img src="/photos/garment-rail.webp" alt="Garments made from recycled yarn" loading="lazy" /></div><div><h2 className="h2">Made from recycled yarn</h2>
          <ul className="chips" style={{ marginTop: 16 }}>{a.products.map((p) => <li key={p} className="glass chip"><b>{p}</b></li>)}</ul></div></div></Reveal>)}
      <AboutMore a={a} />
      <TeamSection />
      {photos.data?.length > 0 && <div className="about-photos">{photos.data.slice(0, 3).map((g) => <Reveal key={g._id}><img className="glass" src={g.imageUrl} alt={g.alt} loading="lazy" /></Reveal>)}</div>}
      <Reveal className="block">
        <GlassCard className="join">
          <div><h2 className="h2">Join RTF</h2><p className="muted">{a.membership}</p></div>
          <Button size="lg" icon="whatsapp" {...(a.joinUrl ? { href: a.joinUrl } : { to: '/contact' })}>Join RTF</Button>
        </GlassCard>
      </Reveal>
    </div>
  );
}

function Photos({ items, empty }) {
  const [idx, setIdx] = useState(null);
  const [loaded, setLoaded] = useState({});
  if (!items.length) return <div className="glass"><EmptyState title={empty} text="Photos will appear here once the office uploads them." /></div>;
  return (
    <>
      <div className="masonry">
        {items.map((g, i) => (
          <button key={g._id} className={`glass tile ${loaded[g._id] ? 'ld' : ''}`} onClick={() => setIdx(i)} aria-label={`Open ${g.alt || 'photo'}`} style={{ aspectRatio: g.w && g.h ? `${g.w}/${g.h}` : '4/3' }}>
            <img src={g.imageUrl} alt={g.alt || ''} loading="lazy" onLoad={() => setLoaded((o) => ({ ...o, [g._id]: 1 }))} />
          </button>
        ))}
      </div>
      <Lightbox items={items.map((g) => ({ src: g.imageUrl, alt: g.alt, caption: g.caption }))} index={idx} onIndex={setIdx} onClose={() => setIdx(null)} />
    </>
  );
}

export function Gallery() {
  useSeo('Gallery', 'Photos of RTF works and events');
  const { data, loading, error, reload } = useFetch('/gallery?category=gallery');
  if (error) return <ErrorCard onRetry={reload} />;
  return (
    <div className="container page-pad section"><Head eyebrow="Gallery" title="Works and events" />
      {loading ? <div className="masonry">{[220, 300, 260, 340, 240, 280].map((h, i) => <Skeleton key={i} h={h} r={24} className="tile-skel" />)}</div> : <Photos items={data} empty="The gallery is empty" />}
    </div>
  );
}

export function Awards() {
  const [sp, setSp] = useSearchParams();
  const { data, loading, error, reload } = useFetch('/awards');
  useSeo('RTF Awards', 'Photos from the RTF Awards');
  if (error) return <ErrorCard onRetry={reload} />;
  const years = [...new Set((data || []).map((a) => a.year))].sort((a, b) => b - a);
  const year = Number(sp.get('year')) || years[0];
  return (
    <div className="container page-pad section"><Head eyebrow="Awards" title={`RTF Awards ${year || ''}`} />
      {loading ? <Skeleton h={300} r={24} /> : (
        <>
          <Tabs label="Award year" value={String(year)} onChange={(v) => setSp({ year: v })} tabs={years.map((y) => ({ value: String(y), label: String(y) }))} />
          <div style={{ marginTop: 24 }}><Photos items={data.filter((a) => a.year === year && a.imageUrl).map((a) => ({ ...a, imageUrl: a.imageUrl }))} empty={`Photos for ${year} are coming soon`} /></div>
        </>)}
    </div>
  );
}

export function Reference() {
  useSeo('Reference charts', 'Labour cost, power cost and cotton vs comber noils charts');
  const { data, loading, error, reload } = useFetch('/reference');
  const [hist, setHist] = useState({});
  if (error) return <ErrorCard onRetry={reload} />;
  const cats = ['Labour cost', 'Power cost', 'Cotton vs comber noils'];
  return (
    <div className="container page-pad section"><Head eyebrow="Reference" title="Reference charts" lead="Cost charts the RTF office updates when numbers change. The latest chart is shown first, older ones sit in history." />
      {loading ? <Skeleton h={300} r={24} /> : cats.map((c) => {
        const e = data?.[c];
        return (
          <Reveal key={c} className="block"><GlassCard className="pad ref-card">
            <div className="row wrap"><h2 className="h2">{c}</h2><span className="spacer" />{e && <Pill icon="cal">{fmtDate(e.latest.date)}</Pill>}</div>
            {!e ? <p className="muted" style={{ marginTop: 12 }}>No chart published yet.</p> : (
              <>
                <h3 style={{ margin: '14px 0 10px', fontSize: '1.0625rem' }}>{e.latest.title}</h3>
                {e.latest.table && <ChartTable t={e.latest.table} />}
                {e.latest.fileUrl && (e.latest.isPdf ? <Button icon="download" href={e.latest.fileUrl}>Download PDF</Button> : <img className="chart-img" src={e.latest.fileUrl} alt={e.latest.alt || e.latest.title} loading="lazy" />)}
                {e.history.length > 1 && <>
                  <button className="more linkish" onClick={() => setHist((h) => ({ ...h, [c]: !h[c] }))} aria-expanded={!!hist[c]}>{hist[c] ? 'Hide' : 'Show'} history ({e.history.length - 1})</button>
                  {hist[c] && <ul className="hist">{e.history.slice(1).map((h) => <li key={h._id}><span>{fmtDate(h.date)}</span><b>{h.title}</b>{h.fileUrl && <a className="more" href={h.fileUrl} target="_blank" rel="noopener noreferrer">Open</a>}</li>)}</ul>}
                </>}
              </>)}
          </GlassCard></Reveal>);
      })}
    </div>
  );
}
const ChartTable = ({ t }) => (
  <div className="table-wrap" style={{ marginBottom: 14 }}><table className="dt"><thead><tr>{t[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
    <tbody>{t.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
);

function ContactForm() {
  const toast = useToast();
  const [f, setF] = useState({ name: '', phone: '', mill: '', message: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Please enter your name';
    if (!/^[+\d][\d\s-]{7,16}$/.test(f.phone.trim())) er.phone = 'Enter a valid phone number';
    if (f.message.trim().length < 5) er.message = 'Please write a short message';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await api.post('/contact', f); setDone(true); toast.success('Message sent. We will call you back.'); }
    catch (x) { setErr(x.fields || {}); toast.error(x.message); }
    finally { setBusy(false); }
  };
  if (done) return <GlassCard className="pad"><EmptyState title="Thank you" text="The RTF office has your message and will get back to you." /></GlassCard>;
  return (
    <GlassCard as="form" className="pad form-grid" onSubmit={submit} noValidate>
      <Input label="Name" value={f.name} onChange={set('name')} error={err.name} autoComplete="name" />
      <Input label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={err.phone} autoComplete="tel" />
      <Input label="Mill name (optional)" value={f.mill} onChange={set('mill')} className="span2" />
      <Textarea label="Message" value={f.message} onChange={set('message')} error={err.message} className="span2" maxLength={1500} />
      <Button type="submit" loading={busy} size="lg" className="span2" arrow>Send message</Button>
    </GlassCard>
  );
}

function Hours({ hours }) {
  const [open, setOpen] = useState(openNow(hours));
  useEffect(() => { const t = setInterval(() => setOpen(openNow(hours)), 30000); return () => clearInterval(t); }, [hours]);
  return (
    <GlassCard className="pad">
      <div className="row wrap"><h3>Opening hours</h3><span className="spacer" /><Pill tone={open ? 'up' : 'down'}><span className="dot" />{open ? 'Open now' : 'Closed now'}</Pill></div>
      <ul className="hours">{hours.map((h) => <li key={h.label}><span>{h.label}</span><b>{h.open ? `${to12h(h.open)} to ${to12h(h.close)}` : 'Closed'}</b></li>)}</ul>
      <p className="muted small">Times shown in IST.</p>
    </GlassCard>
  );
}

export function Contact({ grey }) {
  const { s } = useSettings();
  useSeo(grey ? 'Grey Yarn Members' : 'Contact', 'Get in touch with the RTF office');
  const c = s.contact || {}, soc = s.social || {};
  // Map follows the office address automatically (no API key); an explicit embed link in Settings wins
  // door numbers confuse the geocoder (it snapped 6/73 to a neighbouring 6/58), so search by area + pin code
  const place = (c.address || '').replace(/\s*\n\s*/g, ', ').replace(/^\s*[\d/-]+\s*,\s*/, '').replace(/\s+/g, ' ').trim();
  const mapSrc = c.mapUrl || (place ? `https://www.google.com/maps?q=${encodeURIComponent(place)}&z=15&output=embed` : '');
  const mapLink = place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : '';
  const photos = useFetch(grey ? '/gallery?category=grey-yarn' : null);
  return (
    <div className={`container page-pad section ${grey ? '' : 'contact-page'}`}>
      <Head eyebrow={grey ? 'Members' : 'Contact'} title={grey ? 'RTF Grey Yarn Members' : 'Get in touch'} lead={grey ? 'Mills that make grey yarn, with the office hours and a contact form.' : 'Call, message or write to the RTF office.'} />
      {grey && <div style={{ marginBottom: 32 }}>{photos.loading ? <Skeleton h={260} r={24} /> : <Photos items={photos.data || []} empty="Member photos are coming soon" />}</div>}
      <div className="contact-grid">
        <div className="stack">
          <GlassCard className="pad ci"><Icon name="loc" /><div><b>Address</b><p className="muted" style={{ whiteSpace: 'pre-line' }}>{c.address || 'Address will be updated soon.'}</p></div></GlassCard>
          <GlassCard className="pad ci"><Icon name="phone" /><div><b>Phone</b><p className="muted">{c.phone || 'Not set yet'}</p></div>
            {c.phone && <><span className="spacer" /><CopyButton text={c.phone} label="Copy phone" /><a className="btn btn-primary btn-sm" href={`tel:${c.phone.replace(/\s/g, '')}`}>Call</a></>}</GlassCard>
          <GlassCard className="pad ci"><Icon name="mail" /><div><b>Email</b><p className="muted">{c.email || 'Not set yet'}</p></div>
            {c.email && <><span className="spacer" /><CopyButton text={c.email} label="Copy email" /></>}</GlassCard>
          {(c.whatsapp || c.phone) && <Button size="lg" icon="whatsapp" href={waLink('Hello RTF', c.whatsapp || c.phone)}>Chat on WhatsApp</Button>}
          {s.hours && <Hours hours={s.hours} />}
          <div className="socials-light" aria-label="Social links">
            {['instagram', 'linkedin', 'youtube', 'facebook'].map((k) => soc[k] ? <a key={k} className="icon-btn" href={soc[k]} target="_blank" rel="noopener noreferrer" aria-label={k}><Icon name={k} /></a> : null)}
          </div>
        </div>
        <div className="stack">
          <ContactForm />
          <GlassCard className="map">
            {mapSrc ? (
              <>
                <iframe title="RTF office on Google Maps" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                <div className="map-foot">
                  <span className="muted small">Recycle Textile Federation office</span>
                  <Button size="sm" variant="glass" icon="loc" href={mapLink}>Open in Google Maps</Button>
                </div>
              </>
            ) : <div className="map-ph"><Icon name="loc" size={32} /><p className="muted">Add the office address in Settings to show the map.</p></div>}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  useSeo('Page not found');
  return (
    <div className="container page-pad section"><GlassCard className="err-card"><span className="big grad-text">404</span><h1>This page has moved or never existed</h1>
      <p className="muted">Check the address, or head back to today's rates.</p>
      <div className="row wrap" style={{ justifyContent: 'center' }}><Button to="/" arrow>Go home</Button><Button to="/prices/yarn" variant="glass">Today's rates</Button></div></GlassCard></div>
  );
}
export { DataTable, Select };
