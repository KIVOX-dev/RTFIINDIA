import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { Button, GlassCard, CottonField, Icon, Pill, Reveal, Skeleton, Marquee, AnimatedNumber, Sparkline, Tabs } from '../ui/index.js';
import { NewsCard } from '../components/Cards.jsx';
import { useFetch } from '../lib/api.js';
import { useSettings, useSeo, usePriceMeta } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';
import { num, fmtDate, fmtDateTime, initials, trend, delta } from '../lib/format.js';

const TINTS = ['blue', 'teal', 'mint', 'lilac', 'sand', 'rose'];


/** Pastel illustration used on every tile (original artwork, built from the icon set). */
export function Illus({ icon, tint = 'blue', i = 0 }) {
  return (
    <div className="illus" style={{ background: `var(--tint-${tint})` }} aria-hidden="true">
      <div className="illus-card back"><i /><i className="s" /></div>
      <div className="illus-card" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
        <span className="illus-ic"><Icon name={icon} size={22} /></span>
        <i /><i className="s" />
        <span className="illus-pill" />
      </div>
      <span className="illus-dot"><Icon name="check" size={13} strokeWidth={3} /></span>
    </div>
  );
}

function Hero({ meta, loading }) {
  const { s } = useSettings();
  const rm = true; // no floating / cursor-tilt / parallax: the stacking boxes are the only page motion
  const h = s.hero || {};
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });
  const move = (e) => {
    if (rm || e.pointerType === 'touch') return;
    const b = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - b.left) / b.width - 0.5) * 12);
    rx.set(-((e.clientY - b.top) / b.height - 0.5) * 12);
  };
  const words = (h.tagline || '').split(' ');
  const cut = Math.min(3, Math.max(1, words.length - 2));
  const list = meta?.yarn;
  const names = (list?.items || []).slice(0, 4);
  return (
    <section className="hero2" onPointerMove={(e) => { if (!rm && e.pointerType !== 'touch') e.currentTarget.style.setProperty('--mx', `${((e.clientX / window.innerWidth) - 0.5) * -40}px`); }}>
<video className="hero2-bg hero2-video" src="/textile_fabric.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="hero2-fade" aria-hidden="true" />
      <div className="container hero2-grid">
        <div className="hero2-copy">
          <h1><span className="l1">{words.slice(0, cut).join(' ')}</span><span className="l2">{words.slice(cut).join(' ')}</span></h1>
          {h.points?.length > 0 && <p className="points">{h.points.join(' | ')}</p>}
          <div className="row wrap" style={{ gap: 20, marginTop: 28 }}>
            <Button to="/prices/yarn" size="lg">Today's rates</Button>
            <Link to={h.ctaLink || '/about'} className="textlink">{h.ctaLabel || 'Explore'}</Link>
          </div>
        </div>
        <div className="mock-wrap" onPointerMove={move} onPointerLeave={() => { rx.set(0); ry.set(0); }}>
          <div className={rm ? '' : 'float'}>
            <m.div className="glass mock" style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}>
              <div className="mk-top">
                <span className="mk-ic"><Icon name="price" size={18} /></span>
                <div className="mk-title"><b>Yarn Price List</b><span>Open End yarn · ₹ per kg</span></div>
                {list?.isToday ? <Pill tone="new"><span className="dot" />Updated today</Pill> : list?.date && <Pill>{fmtDate(list.date, { day: 'numeric', month: 'short' })}</Pill>}
              </div>
              <div className="mk-cols"><span>Count</span><span>Rate</span><span>Access</span></div>
              <div className="mk-rows">
                {loading || !names.length ? [0, 1, 2, 3].map((i) => <div key={i} className="mk-row"><Skeleton w={40} h={18} /><Skeleton w={60} h={18} /><Skeleton w={70} h={24} r={999} /></div>)
                  : names.map((n, i) => (
                    <div key={n} className="mk-row">
                      <b>{n}</b>
                      <span className="mk-rate blur" aria-hidden="true">{(1180 + i * 41).toLocaleString('en-IN')}</span>
                      <Pill icon="lock">Members</Pill>
                    </div>))}
              </div>
              <div className="mk-lock">
                <Icon name="lock" size={16} />
                <span>{list?.updatedAt ? `Last published ${fmtDateTime(list.updatedAt)} IST.` : 'Published daily.'} Sign in to view the rates.</span>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUICK = [['/prices/yarn', 'Yarn price list', 'price'], ['/prices/cai', 'CAI spot rate', 'tag'], ['/news', 'Daily news', 'news'], ['/reference', 'Reference charts', 'ref'], ['/events', 'Events', 'cal'], ['/contact', 'Contact', 'phone']];
function QuickBar() {
  return (
    <div className="container">
      <nav className="glass quick" aria-label="Quick links">
        <span className="quick-l"><Icon name="grid" size={18} /> Looking for something?</span>
        <ul>{QUICK.map(([to, t, ic]) => <li key={to}><Link to={to} className="qchip"><Icon name={ic} size={16} />{t}</Link></li>)}</ul>
      </nav>
    </div>
  );
}

function MillMarquee() {
  const { data } = useFetch('/members');
  const firms = [...new Set((data || []).map((x) => x.firm).filter(Boolean))];
  if (!firms.length) return <div style={{ height: 40 }} />;
  return (
    <section className="mills">
      <p className="mills-l">Mills and members across Tamil Nadu</p>
      <Marquee duration={firms.length * 5} gap={64} label="Member mills">
        {firms.map((f) => <span key={f} className="mill-name">{f}</span>)}
      </Marquee>
    </section>
  );
}

function PhoneRates({ yarn }) {
  const rows = (yarn?.items || []).slice(0, 3);
  return (
    <div className="phone" aria-hidden="true">
      <div className="ph-top"><span className="ph-logo">R</span><b>RTF Yarn Price List</b><span className="ph-live"><span className="dot" />Members</span></div>
      <div className="ph-bar"><span>Rates for</span><b>{yarn?.date ? fmtDate(yarn.date, { day: 'numeric', month: 'short', year: 'numeric' }) : '…'}</b></div>
      <div className="ph-sec"><span>Open End yarn, per kg</span><span className="ph-secure"><Icon name="check" size={11} strokeWidth={3} /> Verified</span></div>
      <div className="ph-btn"><Icon name="lock" size={16} /> Member sign in</div>
      <div className="ph-btn"><Icon name="download" size={16} /> Download CSV</div>
      <div className="ph-or"><i />or<i /></div>
      <div className="ph-rows">
        {rows.map((r) => (
          <div key={r} className="ph-row"><span>{r}</span><b className="blur">₹1,234</b><Icon name="lock" size={12} /></div>
        ))}
      </div>
    </div>
  );
}

function PhoneNews({ news }) {
  return (
    <div className="phone" aria-hidden="true">
      <div className="ph-top"><span className="ph-logo">R</span><b>RTF Daily Updates</b><span className="ph-live"><span className="dot" />New</span></div>
      <div className="ph-bar"><span>Latest from the office</span><b>{news.length} cards</b></div>
      <div className="ph-rows nl">
        {news.map((n) => (
          <div key={n.id} className="ph-news"><span className="fm-cat">{n.category}</span><b>{n.title}</b><span>{n.summary}</span></div>
        ))}
      </div>
    </div>
  );
}

/** Razorpay-style promo banner: dark panel, big headline, phone mockup cropped at the bottom, carousel dots. */
function Promo() {
  const { s } = useSettings();
  const rm = useReducedMotion();
  const yarn = usePriceMeta().meta?.yarn;
  const news = (useFetch('/posts?kind=news&limit=3', { silent: true }).data?.items || []).slice(0, 3);
  const slides = [s.home?.promo, s.home?.promo2].filter(Boolean);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (rm || paused || slides.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [rm, paused, slides.length]);
  if (!slides.length) return null;
  const sl = slides[i % slides.length];
  return (
    <div className="container">
      <Reveal>
        <section className="promo2" aria-roledescription="carousel" aria-label="Highlights" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="p2-bg" aria-hidden="true" />
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={i} className="p2-in" initial={{ opacity: 0, x: rm ? 0 : 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: rm ? 0 : -36 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <div className="p2-copy">
                <h2>{sl.title}</h2>
                <Button variant="light" to={sl.link || '/prices/yarn'}>{sl.cta || 'Know more'}</Button>
              </div>
              <div className="p2-art">
                <div className="p2-chip c1"><b>6s</b><span className="up">▲</span></div>
                <div className="p2-chip c2"><b>CAI</b><span className="down">▼</span></div>
                {i % 2 === 0 ? <PhoneRates yarn={yarn} /> : <PhoneNews news={news} />}
              </div>
            </m.div>
          </AnimatePresence>
          {slides.length > 1 && (
            <div className="p2-dots" role="tablist" aria-label="Choose slide">
              {slides.map((_, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}

function Platform() {
  const { s } = useSettings();
  const pl = s.home?.platform;
  if (!pl) return null;
  return (
    <section className="platform">
      <div className="container">
        <Reveal>
          <h2 className="platform-h">{pl.before} <span className="hl">{pl.highlight}</span> {pl.after}</h2>
          <div className="platform-row"><span className="muted small">With RTF, you can:</span>
            <a href="#prices">See daily rates</a><a href="#news">Read updates</a><a href="#why">Why RTF</a><a href="#leaders">Meet the committee</a></div>
        </Reveal>
      </div>
    </section>
  );
}

/** Razorpay-style stacking: each section pins under the header and the next one slides up over it.
 *  Tall sections pin by their bottom edge instead, so their whole content can still be read first. */
function useStack() {
  const ref = useRef(null);
  const rm = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      if (rm || window.innerWidth < 860) { el.style.position = 'relative'; el.style.top = 'auto'; return; }
      el.style.position = 'sticky';
      el.style.top = `${Math.min(NAV_OFFSET, window.innerHeight - el.offsetHeight - 8)}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => { ro.disconnect(); window.removeEventListener('resize', apply); };
  }, [rm]);
  return ref;
}

const NAV_OFFSET = 76; // the section tab bar (56px) is the only pinned bar on the home page, plus a little breathing room

function SCard({ id, title, aside, children }) {
  const ref = useStack();
  return (
    <>
      {id && <span id={id} className="anchor" aria-hidden="true" />}
      <section className="scard-wrap stacked" ref={ref}>
        <div className="container">
          <div className="scard">
            <div className="scard-head"><h2>{title}</h2><span className="spacer" />{aside}</div>
            {children}
          </div>
        </div>
      </section>
    </>
  );
}

const SECTIONS = [['prices', 'Live prices'], ['news', 'News'], ['why', 'Why RTF'], ['leaders', 'Leadership'], ['glance', 'At a glance']];
/** Sticky tab bar under the header (Razorpay-style): underline follows the section you are in. */
function SectionNav() {
  const [active, setActive] = useState(SECTIONS[0][0]);
  useEffect(() => {
    const f = () => {
      let cur = SECTIONS[0][0];
      for (const [id] of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= NAV_OFFSET + 40) cur = id;
      }
      setActive(cur);
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const go = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, behavior: 'smooth' });
  };
  return (
    <div className="secnav" role="navigation" aria-label="Sections">
      <div className="container secnav-in">
        <div className="secnav-tabs">
          {SECTIONS.map(([id, label]) => (
            <button key={id} type="button" className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined} onClick={() => go(id)}>{label}</button>
          ))}
        </div>
        <Button to="/prices/yarn" size="sm" className="secnav-cta" arrow>Today's rates</Button>
      </div>
    </div>
  );
}

function PriceTile({ type, title, sub, tint, icon, meta }) {
  const { user } = useUser();
  const m = meta?.[type];
  const names = (m?.items || []).slice(0, 6);
  return (
    <div className="ptile">
      <div className="ptile-head" style={{ background: `var(--tint-${tint})` }}>
        <span className="ptile-ic"><Icon name={icon} size={22} /></span>
        <div><b>{title}</b><span className="muted small">{sub}</span></div>
        <span className="spacer" />
        {m?.isToday && <Pill tone="new"><span className="dot" />Updated today</Pill>}
        {m?.date && <Pill>{fmtDate(m.date, { day: 'numeric', month: 'short' })}</Pill>}
      </div>
      <div className="pb-list pb-locked">
        {!meta ? Array.from({ length: 6 }, (_, i) => <div key={i} className="pb-row"><Skeleton w="30%" h={18} /><span className="spacer" /><Skeleton w="20%" h={18} /></div>)
          : names.length ? names.map((n, i) => (
            <div key={n} className="pb-row"><b>{n}</b><span className="spacer" /><span className="pb-rate blur" aria-hidden="true">{(1180 + i * 41).toLocaleString('en-IN')}</span><Icon name="lock" size={14} /></div>
          )) : <p className="muted" style={{ padding: '24px 0' }}>Today's rates will be published soon.</p>}
      </div>
      <p className="muted small" style={{ padding: '0 20px' }}>
        {m?.updatedAt ? `Last published ${fmtDateTime(m.updatedAt)} IST. ` : ''}Rates are for registered RTF members.
      </p>
      <Link to={user ? `/dashboard?tab=${type}` : '/login'} state={user ? undefined : { from: `/dashboard?tab=${type}` }} className="btn btn-glass btn-sm" style={{ margin: '12px 20px 20px' }}>
        {user ? 'Open in dashboard' : 'Sign in to view rates'} <Icon name="arrow" size={16} className="arrow" />
      </Link>
    </div>
  );
}

function News() {
  const { data, loading } = useFetch('/posts?kind=news&limit=6');
  if (!loading && !data?.items?.length) return null;
  return (
    <SCard id="news" title="News and daily updates" aside={<Link to="/news" className="more">View all news <Icon name="arrow" size={16} className="arrow" /></Link>}>
      <div className="strip" tabIndex={0} aria-label="Latest news cards, scroll sideways">
        {loading ? [0, 1, 2].map((i) => <div key={i} className="strip-item"><Skeleton h={250} r={12} /></div>)
          : data.items.map((p, i) => <div key={p.id} className="strip-item"><NewsCard post={p} index={i} /></div>)}
      </div>
    </SCard>
  );
}

const GRADS = [['#cfe0ff', '#8fb1ff'], ['#c9f0ec', '#7fd6cf'], ['#d3f5df', '#86dba6'], ['#e3dcff', '#b5a4f5'], ['#fde9c5', '#f6c27a'], ['#fddada', '#f5a3a3']];

function MockCard({ title, tag, children, foot }) {
  return (
    <div className="fm-card">
      <div className="fm-title"><b>{title}</b>{tag}</div>
      {children}
      {foot && <div className="fm-foot">{foot}</div>}
    </div>
  );
}
const MRow = ({ l, r, tone = '' }) => <div className="fm-row"><span>{l}</span><b className={tone}>{r}</b></div>;
const Ok = ({ children, icon = 'check' }) => <span className="fm-chip ok"><Icon name={icon} size={12} strokeWidth={3} /> {children}</span>;

/** Mini product screens built from live RTF data (prices, members, awards, news). */
function FeatureMock({ kind }) {
  const yarn = usePriceMeta().meta?.yarn;
  const members = useFetch('/members', { silent: true }).data || [];
  const awards = useFetch('/awards', { silent: true }).data || [];
  const news = (useFetch('/posts?kind=news&limit=3', { silent: true }).data?.items || []).slice(0, 3);
  const count = (g) => members.filter((m) => m.group === g).length;
  if (kind === 'price') {
    const rows = (yarn?.items || []).slice(0, 3);
    return (
      <MockCard title="Yarn price list" tag={<Pill tone={yarn?.isToday ? 'new' : ''}>{yarn?.isToday ? 'Updated today' : yarn?.date ? fmtDate(yarn.date, { day: 'numeric', month: 'short' }) : '…'}</Pill>} foot={<Ok icon="lock">Members only</Ok>}>
        {rows.length ? rows.map((r) => <MRow key={r} l={`${r} yarn`} r={<span className="blur" aria-hidden="true">₹1,234</span>} />) : [0, 1, 2].map((i) => <MRow key={i} l="–" r="–" />)}
      </MockCard>
    );
  }
  if (kind === 'meet')
    return (
      <MockCard title="Committee meetings" tag={<Pill>Regular</Pill>} foot={<Ok>Members informed</Ok>}>
        <MRow l="Executive Committee" r={`${count('office')} members`} />
        <MRow l="Zonal Secretaries" r={`${count('zonal')} members`} />
        <MRow l="Management Committee" r={`${count('management')} members`} />
      </MockCard>
    );
  if (kind === 'free')
    return (
      <MockCard title="RTF membership" tag={<Pill tone="new">Free</Pill>} foot={<Ok>Open to OE mills</Ok>}>
        <MRow l="Membership fee" r="Free" tone="ok" />
        <MRow l="Member benefits" r="All free" tone="ok" />
        <MRow l="Buyer and fair exposure" r="Included" tone="ok" />
      </MockCard>
    );
  if (kind === 'award') {
    const years = [...new Set(awards.map((a) => a.year))].sort((a, b) => b - a).slice(0, 3);
    return (
      <MockCard title="RTF Awards" tag={<Pill icon="award">Annual</Pill>} foot={<span className="fm-chip"><Icon name="image" size={12} /> Photo galleries</span>}>
        {years.length ? years.map((y) => <MRow key={y} l={`RTF Awards ${y}`} r={`${awards.filter((a) => a.year === y && a.imageUrl).length} photos`} />) : <MRow l="RTF Awards" r="Coming soon" />}
      </MockCard>
    );
  }
  if (kind === 'news')
    return (
      <MockCard title="Latest updates" tag={<Pill tone="new"><span className="dot" />Daily</Pill>} foot={<span className="fm-chip"><Icon name="whatsapp" size={12} /> Share in one tap</span>}>
        {news.length ? news.map((n) => <MRow key={n.id} l={<span className="fm-clip">{n.title}</span>} r={<span className="fm-cat">{n.category}</span>} />) : <MRow l="No updates yet" r="" />}
      </MockCard>
    );
  const office = members.filter((m) => m.group === 'office').slice(0, 4);
  return (
    <MockCard title="RTF WhatsApp group" tag={<Pill tone="new"><span className="dot" />Active</Pill>} foot={<Ok icon="whatsapp">Ask the executive committee to join</Ok>}>
      <div className="fm-avatars">{office.map((m) => <span key={m._id} className="fm-av">{initials(m.name)}</span>)}{office.length > 0 && <span className="fm-av more">+</span>}</div>
      <MRow l="Daily rates and notices" r="Shared" tone="ok" />
    </MockCard>
  );
}

function Features() {
  const { s } = useSettings();
  if (!s.features?.length) return null;
  return (
    <SCard id="why" title="Why RTF">
      <div className="tiles">
        {s.features.map((f, i) => (
          <Reveal key={f.title} i={i % 3} className="tile-card fmt">
            <div className="fm" style={{ background: `linear-gradient(135deg, ${GRADS[i % GRADS.length][0]}, ${GRADS[i % GRADS.length][1]})` }} aria-hidden="true">
              <FeatureMock kind={f.icon} />
            </div>
            <div className="fnum"><span className="fnum-b">{i + 1}</span><i /></div>
            <h3>{f.title}</h3><p className="muted">{f.text}</p>
          </Reveal>
        ))}
      </div>
    </SCard>
  );
}

function Vision() {
  const { s } = useSettings();
  const ref = useStack();
  if (!s.vision) return null;
  return (
    <section className="vision-wrap stacked" ref={ref}>
      <div className="container">
        <Reveal>
          <div className="vision2">
            <div className="vision-blob" aria-hidden="true" />
            <div><span className="eyebrow light">Our vision</span><h2>{s.vision.heading}</h2></div>
            <GlassCard dark className="quote"><Icon name="community" size={28} /><p>{s.vision.text}</p></GlassCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PersonCard({ p, sub }) {
  return (
    <article className={`person ${p.photoUrl ? '' : 'nophoto'}`}>
      <div className="pphoto">
        {p.photoUrl ? <img src={p.photoUrl} alt={p.name} loading="lazy" width="360" height="400" /> : <span className="pinit" aria-hidden="true">{initials(p.name)}</span>}
      </div>
      <h3>{p.name}</h3>
      <p className="prole">{sub}</p>
      {p.firm && p.firm !== sub && <p className="pfirm">{p.firm}</p>}
      {p.linkedin && <a className="pin-link" href={p.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} on LinkedIn`}><Icon name="linkedin" size={22} /></a>}
    </article>
  );
}

function Leadership() {
  const { data, loading } = useFetch('/members');
  const by = (g) => (data || []).filter((x) => x.group === g);
  return (
    <SCard id="leaders" title="Executive Committee (Office Bearers)">
      <div className="people">
        {loading ? Array.from({ length: 6 }, (_, i) => <div key={i} className="person"><Skeleton w={72} h={72} r={999} /><Skeleton w="70%" h={18} /><Skeleton w="50%" h={14} /></div>)
          : by('office').map((p) => <PersonCard key={p._id} p={p} sub={p.role} />)}
      </div>
      {!loading && by('zonal').length > 0 && (
        <div className="chips-block"><h3>Zonal Secretaries</h3>
          <div className="people">{by('zonal').map((p) => <PersonCard key={p._id} p={p} sub={p.firm || p.role} />)}</div></div>)}
      {!loading && by('management').length > 0 && (
        <div className="chips-block"><h3>Management Committee Members</h3>
          <p className="muted" style={{ marginBottom: 14 }}>A strong, co-operative and wide-spanned team of members across Tamil Nadu.</p>
          <div className="people">{by('management').map((p) => <PersonCard key={p._id} p={p} sub={p.firm || p.role} />)}</div></div>)}
    </SCard>
  );
}

function GalleryPreview() {
  const { data } = useFetch('/gallery?category=gallery');
  if (!data?.length) return null;
  return (
    <SCard title="Gallery" aside={<Link to="/gallery" className="more">See more <Icon name="arrow" size={16} className="arrow" /></Link>}>
      <div className="gal-prev">{data.slice(0, 6).map((g) => <Link key={g._id} to="/gallery" className="gp"><img src={g.imageUrl} alt={g.alt} loading="lazy" /></Link>)}</div>
    </SCard>
  );
}

export function Counters() {
  const { s } = useSettings();
  if (!s.stats?.length) return null;
  return (
    <div className="counters">
      {s.stats.map((x, i) => (
        <Reveal key={x.label} i={i}>
          <div className="counter">
            <div className="count"><AnimatedNumber value={Number(x.value)} from={0} duration={1.4} /><span>{x.suffix}</span></div>
            <p className="muted">{x.label}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function CtaBand() {
  const { s } = useSettings();
  const join = s.about?.joinUrl;
  const ref = useStack();
  return (
    <section className="scard-wrap stacked" ref={ref}>
      <div className="container">
        <Reveal>
          <div className="cta">
            <div className="cta-blob" aria-hidden="true" />
            <h2>Membership is free. All benefits are free.</h2>
            <p>Join the active RTF WhatsApp group and get daily rates and notices first.</p>
            <div className="row wrap" style={{ gap: 12, justifyContent: 'center' }}>
              <Button variant="light" size="lg" icon="whatsapp" {...(join ? { href: join } : { to: '/contact' })}>Join RTF</Button>
              <Button variant="glass" size="lg" className="on-dark" to="/about">About RTF</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** While a box slides up over the one pinned behind it, clip the hidden box below the new box's top edge,
 *  so a taller box behind never peeks out under a shorter one in front. */
function useStackClip() {
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      const els = [...document.querySelectorAll('.stacked')];
      els.forEach((el, i) => {
        const next = els[i + 1];
        if (!next || el.style.position !== 'sticky') { el.style.clipPath = ''; return; }
        const cut = Math.max(0, el.getBoundingClientRect().bottom - next.getBoundingClientRect().top);
        el.style.clipPath = cut > 0 ? `inset(-40px -40px ${cut}px -40px)` : '';
      });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const t = setInterval(on, 800); // content (news, members) loads after mount
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); clearInterval(t); cancelAnimationFrame(raf); };
  }, []);
}

export default function Home() {
  const { s, ready } = useSettings();
  const [tab, setTab] = useState('yarn');
  useStackClip();
  useSeo('', s.hero?.tagline);
  const { meta, loading: metaLoading } = usePriceMeta();
  if (!ready) return <div className="container page-pad section"><Skeleton h={48} w="60%" /><Skeleton h={300} style={{ marginTop: 24 }} r={12} /></div>;
  return (
    <>
      <Hero meta={meta} loading={metaLoading} />
      <QuickBar />
      <MillMarquee />
      <Promo />
      <Platform />
      <SectionNav />
      <SCard id="prices" title="Member price lists" aside={<div className="only-m"><Tabs label="Price list" value={tab} onChange={setTab} tabs={[{ value: 'yarn', label: 'Yarn' }, { value: 'cai', label: 'CAI' }]} /></div>}>
        <div className="ptiles">
          <div className={tab === 'yarn' ? '' : 'hide-m'}><PriceTile meta={meta} type="yarn" title="Yarn Price List" sub="OE yarn rates, updated daily" tint="blue" icon="price" /></div>
          <div className={tab === 'cai' ? '' : 'hide-m'}><PriceTile meta={meta} type="cai" title="CAI Spot Rate" sub="Cotton Association of India spot rates" tint="teal" icon="tag" /></div>
        </div>
      </SCard>
      <News />
      <Features />
      <Vision />
      <Leadership />
      <GalleryPreview />
      <SCard id="glance" title="RTF at a glance"><Counters /></SCard>
      <CtaBand />
    </>
  );
}
