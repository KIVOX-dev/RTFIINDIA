import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon, Reveal, Skeleton, AnimatedNumber } from '../ui/index.js';
import Spot from '../components/Spot.jsx';
import { NewsCard } from '../components/Cards.jsx';
import { useFetch } from '../lib/api.js';
import { useSettings, useSeo, usePriceMeta } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';
import { fmtDate, initials } from '../lib/format.js';
import { useHeroMotion, useReveal, useHeadings, useHomeMotion, useStackMotion } from '../lib/motion.js';

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


/** Section wrapper: eyebrow + heading + optional aside, plain full-width bands (no stacking). */
function Band({ id, tone = '', eyebrow, title, aside, children }) {
  const ref = useRef(null);
  useHeadings(ref, '.bc-head h2');
  useReveal(ref, '.bc-eyebrow, .bc-head .more', [], { y: 16, start: 'top 90%' });
  return (
    <section id={id} ref={ref} className={`bc-band ${tone}`}>
      <div className="container">
        {(eyebrow || title) && (
          <div className="bc-head">
            <div>{eyebrow && <p className="bc-eyebrow">{eyebrow}</p>}{title && <h2>{title}</h2>}</div>
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

const photo = (n) => `/photos/${n}.webp`;
const split = (line) => { const i = line.indexOf('|'); return i < 0 ? [line.trim(), ''] : [line.slice(0, i).trim(), line.slice(i + 1).trim()]; };

/** A photograph in a frame: hover zooms it a hair inside the frame, nothing else moves. */
function Photo({ name, alt = '', className = '', eager = false }) {
  return <div className={`bc-photo ${className}`}><img src={photo(name)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" {...(eager ? { fetchpriority: 'high' } : {})} /></div>;
}

function Hero() {
  const { s } = useSettings();
  const { meta } = usePriceMeta();
  const { user } = useUser();
  const { data } = useFetch('/members', { silent: true });
  const h = s.hero || {};
  const y = meta?.yarn;
  const mills = s.stats?.[0];
  const root = useRef(null);
  useHeroMotion(root);
  const board = (data || []).filter((x) => x.group === 'office').length;
  return (
    <section className="bc-hero" ref={root}>
      <img className="bc-hero-bg" src={photo('mill-corridor')} alt="" fetchpriority="high" />
      <div className="bc-hero-shade" aria-hidden="true" />
      <div className="container bc-hero-in">
        <p className="bc-kicker">Recycle Textile Federation · Coimbatore</p>
        <h1>{h.tagline}</h1>
        <div className="bc-hero-cta">
          <Button to="/prices/yarn" size="lg" variant="light" arrow>Today&apos;s rates</Button>
          <Button to={user ? '/dashboard' : '/login'} variant="glass" size="lg" className="on-dark">{user ? 'Open my dashboard' : 'Member login'}</Button>
        </div>
      </div>
      <div className="container bc-facts">
        <div><b>{mills ? `${mills.value}${mills.suffix || ''}` : '–'}</b><span>{mills?.label || 'mills'}</span></div>
        <div><b>{board || '–'}</b><span>office bearers leading RTF</span></div>
        <div><b className={y?.isToday ? 'live' : ''}>{y?.isToday ? 'Live' : 'Daily'}</b><span>{y?.isToday ? `rates for ${fmtDate(y.date, { day: 'numeric', month: 'short' })}` : 'yarn and CAI rates'}</span></div>
        <div><b>Free</b><span>membership, all benefits</span></div>
      </div>
    </section>
  );
}

function Intro() {
  const { s } = useSettings();
  return (
    <Band id="about" eyebrow="Who we are" title={s.vision?.heading || 'Recycle Textile Federation'}>
      <div className="bc-intro">
        <div className="bc-intro-text">
          <p className="bc-statement">{s.vision?.text}</p>
          <ul className="bc-ticks">{(s.features || []).slice(0, 3).map((f) => <li key={f.title}>{f.title}</li>)}</ul>
          <Button to="/about" arrow>About RTF</Button>
        </div>
        <Photo name="mill-hall-green" alt="Open End spinning hall" className="tall" />
      </div>
    </Band>
  );
}

const STEP_PHOTOS = ['sorting-tables', 'shredding-line', 'mill-spinning-frames', 'yarn-cones-stack'];
const STEP_FALLBACK = [['Sort', 'Waste cloth is sorted by fibre and colour.'], ['Shred', 'Sorted cloth is opened back into fibre.'], ['Spin', 'Open End frames spin the fibre into yarn.'], ['Supply', 'Yarn goes to weavers and knitters on cones.']];
function Process() {
  const { s } = useSettings();
  const steps = (s.about?.steps?.length ? s.about.steps.map(split) : STEP_FALLBACK).slice(0, 4);
  const ref = useRef(null);
  useReveal(ref, '.bc-step', [steps.length]);
  return (
    <Band tone="sand" id="process" eyebrow="How recycling works" title="From waste cloth to Open End yarn">
      <ol className="bc-steps" ref={ref} style={{ '--n': steps.length }}>
        {steps.map(([t, d], i) => (
          <li key={t} className="bc-step">
            <Photo name={STEP_PHOTOS[i]} alt={t} />
            <span className="bc-step-n">{String(i + 1).padStart(2, '0')}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </li>
        ))}
      </ol>
    </Band>
  );
}

/** Full-bleed portrait cards: the committee is the face of the site. */
function Stories() {
  const { data, loading } = useFetch('/members');
  const list = (data || []).filter((x) => x.group === 'office');
  const ref = useRef(null);
  useReveal(ref, '.bc-face', [list.length], { stagger: 0.09, y: 60, from: { clipPath: 'inset(0% 0% 100% 0% round 18px)' }, to: { clipPath: 'inset(0% 0% 0% 0% round 18px)' }, duration: 1.1 });
  return (
    <Band id="faces" eyebrow="Our committee" title="The people behind RTF"
      aside={<Button to="/about#team" variant="glass" arrow>Meet the whole committee</Button>}>
      <div className="bc-faces" ref={ref}>
        {loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={420} r={16} />)
          : list.map((p, i) => (
            <article key={p._id} className={`bc-face ${i === 0 ? 'lead' : ''}`}>
              {p.photoUrl ? <img src={p.photoUrl} alt={p.name} loading="lazy" /> : <span className="bc-face-init">{initials(p.name)}</span>}
              <div className="bc-face-cap"><h3>{p.name}</h3><p>{p.role}</p></div>
            </article>
          ))}
      </div>
    </Band>
  );
}

function Marquee2() {
  const words = ['Collect', 'Sort', 'Shred', 'Spin', 'Supply'];
  const row = (k) => <div className="bc-marquee-track" key={k}>{[...words, ...words, ...words].map((w, i) => <span key={i}>{w}<i /></span>)}</div>;
  return <div className="bc-marquee" aria-hidden="true">{row(0)}{row(1)}</div>;
}

const TILE_PHOTOS = ['plant-aerial', 'cones-concrete', 'cones-sage', 'mill-spinning-frames', 'design-swatches'];
function StatsBand() {
  const { s } = useSettings();
  const ref = useRef(null);
  useHeadings(ref, '.bc-glance-copy h2', [s.stats?.length]);
  useReveal(ref, '.bc-glance-copy > :not(h2), .bc-tile', [s.stats?.length], { stagger: 0.1, y: 50, from: { scale: 0.9, rotate: -2 }, ease: 'back.out(1.3)', duration: 1 });
  if (!s.stats?.length) return null;
  return (
    <section id="glance" ref={ref} className="bc-band bc-glance">
      <div className="container bc-glance-in">
        <div className="bc-glance-copy">
          <p className="bc-eyebrow">RTF at a glance</p>
          <h2>Open End spinning mills, working as one</h2>
          <p>A Tamil Nadu federation sharing daily rates, meetings and market news with every member mill.</p>
          <Button to="/about" arrow>Know more</Button>
        </div>
        <div className="bc-tiles">
          {s.stats.map((x, i) => (
            <div key={x.label} className={`bc-tile t${i % 5} ${i === 0 ? 'big' : ''}`}>
              <img className="bc-tile-img" src={photo(TILE_PHOTOS[i % TILE_PHOTOS.length])} alt="" aria-hidden="true" loading="lazy" />
              <div className="bc-num"><AnimatedNumber value={Number(x.value)} from={0} duration={1.4} /><span className="bc-suf">{x.suffix}</span></div>
              <p>{x.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY_PHOTOS = ['cones-white', 'design-swatches', 'export-container', 'cotton-team', 'world-map', 'women-gathering'];
const WHY_SPOTS = ['chart', 'people', 'globe', 'yarn', 'news', 'chat'];
const WHY_COLORS = ['#0a1c3d', '#0d6b46', '#1e3a8a', '#0e7490', '#7c2d12', '#14532d'];
/** Stacked cards: each point is a full-width card; the next one slides up over the last as you scroll. */
function Pillars() {
  const { s } = useSettings();
  const items = s.features || [];
  const ref = useRef(null);
  useStackMotion(ref, items.length);
  if (!items.length) return null;
  return (
    <Band id="why" eyebrow="What we do" title="Why mills choose RTF">
      <div className="bc-stack" ref={ref}>
        {items.map((f, i) => (
          <article key={f.title} className="bc-sc" style={{ '--i': i, '--c': WHY_COLORS[i % WHY_COLORS.length] }}>
            <div className="bc-sc-text">
              <span className="bc-sc-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="bc-sc-ic"><Spot name={WHY_SPOTS[i % WHY_SPOTS.length]} size={40} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
            <div className="bc-sc-photo"><img src={photo(WHY_PHOTOS[i % WHY_PHOTOS.length])} alt="" loading="lazy" decoding="async" /></div>
          </article>
        ))}
      </div>
    </Band>
  );
}

function News() {
  const { data, loading } = useFetch('/posts?kind=news&limit=3');
  const ref = useRef(null);
  useReveal(ref, '.news-card', [data?.items?.length, loading]);
  if (!loading && !data?.items?.length) return null;
  return (
    <Band id="news" eyebrow="Latest updates" title="News"
      aside={<Button to="/news" variant="glass" arrow>See all updates</Button>}>
      <div className="bc-news" ref={ref}>
        {loading ? [0, 1, 2].map((i) => <Skeleton key={i} h={280} r={12} />) : data.items.map((p, i) => <NewsCard key={p.id} post={p} index={i} />)}
      </div>
    </Band>
  );
}

const BENEFITS = [
  { icon: 'chart', title: 'Daily rates', photo: 'cones-concrete', short: 'Yarn Price List and CAI spot rates published every day, in your member dashboard.',
    more: 'Register on this site and the RTF office approves your request. Approved members see the Open End yarn price list and the CAI spot rates for the day in their dashboard, ready to check and share.', cta: ['Member login', '/login'] },
  { icon: 'chat', title: 'WhatsApp group', photo: 'women-gathering', short: 'Join the active RTF WhatsApp group and get rates and notices first.',
    more: 'Interested mills ask the executive committee to add them to the active RTF WhatsApp group. Daily rates, market updates and notices reach members there first.', cta: ['Ask the office', '/contact'] },
  { icon: 'free', title: 'Free membership', photo: 'couple-yarn', short: 'Membership is free, and so are all member benefits.',
    more: 'There is no membership fee and no charge for any member benefit. Open End spinning mills register on this site, and the RTF office approves them.', cta: ['See how to join', '/about'] },
  { icon: 'people', title: 'Committee meetings', photo: 'design-swatches', short: 'Regular executive, zonal and management meetings keep mills connected.',
    more: 'The Executive Committee, the Zonal Secretaries and the Management Committee meet regularly. Members are kept informed, so every mill stays close to the decisions that affect the industry.', cta: ['Meet the committee', '/about#team'] },
  { icon: 'globe', title: 'Buyer and fair exposure', photo: 'export-container', short: 'Your mill gets exposure to buyers and fairs through the federation.',
    more: 'As part of a federation of Open End spinning mills across Tamil Nadu, members get exposure to buyers and to textile fairs the federation takes part in.', cta: ['About RTF', '/about'] },
  { icon: 'news', title: 'News and awards', photo: 'cotton-team', short: 'Daily market and policy news, event notices and the annual RTF Awards.',
    more: 'Daily market updates, cotton and raw material news, policy changes and event notices are shared on this site. The annual RTF Awards recognise mills and people who move recycled textiles forward.', cta: ['Read the news', '/news'] },
];
function BenefitCard({ b }) {
  const [flip, setFlip] = useState(false);
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip((f) => !f); } };
  return (
    <article className={`bc-ben-card ${flip ? 'is-flipped' : ''}`} tabIndex={0} role="button" aria-pressed={flip}
      aria-label={`${b.title}. Press to ${flip ? 'go back' : 'read more'}`} onClick={() => setFlip((f) => !f)} onKeyDown={key} onMouseLeave={() => setFlip(false)}>
      <div className="bc-flip">
        <div className="bc-fside bc-front">
          <div className="bc-ben-ph"><img src={photo(b.photo)} alt="" loading="lazy" decoding="async" /><span className="bc-flip-hint" aria-hidden="true"><Icon name="refresh" size={16} /> Flip</span></div>
          <div className="bc-ben-body">
            <div className="spot-row"><Spot name={b.icon} /><h3>{b.title}</h3></div>
            <p>{b.short}</p>
          </div>
        </div>
        <div className="bc-fside bc-back">
          <span className="bc-back-ic"><Spot name={b.icon} size={44} /></span>
          <h3>{b.title}</h3>
          <p>{b.more}</p>
          <Link to={b.cta[1]} className="bc-back-link" onClick={(e) => e.stopPropagation()}>{b.cta[0]} <Icon name="arrow" size={16} className="arrow" /></Link>
        </div>
      </div>
    </article>
  );
}

function Benefits() {
  const { user } = useUser();
  const { s } = useSettings();
  const join = s.about?.joinUrl;
  const ref = useRef(null);
  useReveal(ref, '.bc-ben-card', [], { y: 36, stagger: 0.08 });
  return (
    <Band id="benefits" tone="sand" eyebrow="Membership" title="Benefits of becoming a member"
      aside={<div className="bc-ben-cta"><Button icon="whatsapp" {...(join ? { href: join } : { to: '/contact' })}>Join RTF</Button>{!user && <Link to="/login" className="more">Member login <Icon name="arrow" size={16} className="arrow" /></Link>}</div>}>
      <div className="bc-ben" ref={ref}>
        {BENEFITS.map((b) => <BenefitCard key={b.title} b={b} />)}
      </div>
    </Band>
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

/** Zonal Secretaries and Management Committee, shown on the About page. */
export function TeamSection() {
  return (
    <section className="block team-block" id="team">
      <p className="bc-eyebrow">Our people</p>
      <h2 className="h2">The RTF committee</h2>
      <LeadershipBody />
    </section>
  );
}

function LeadershipBody() {
  const { data, loading } = useFetch('/members');
  const by = (g) => (data || []).filter((x) => x.group === g);
  return (
    <>
      <div className="chips-block first"><h3>Executive Committee (Office Bearers)</h3>
        <div className="people">
          {loading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="person"><Skeleton w={72} h={72} r={999} /><Skeleton w="70%" h={18} /><Skeleton w="50%" h={14} /></div>)
            : by('office').map((p) => <PersonCard key={p._id} p={p} sub={p.role} />)}
        </div>
      </div>
      {!loading && by('zonal').length > 0 && (
        <div className="chips-block"><h3>Zonal Secretaries</h3>
          <div className="people">{by('zonal').map((p) => <PersonCard key={p._id} p={p} sub={p.firm || p.role} />)}</div></div>)}
      {!loading && by('management').length > 0 && (
        <div className="chips-block"><h3>Management Committee Members</h3>
          <p className="muted" style={{ marginBottom: 14 }}>A strong, co-operative and wide-spanned team of members across Tamil Nadu.</p>
          <div className="people">{by('management').map((p) => <PersonCard key={p._id} p={p} sub={p.firm || p.role} />)}</div></div>)}
    </>
  );
}

function GalleryPreview() {
  const { data } = useFetch('/gallery?category=gallery');
  if (!data?.length) return null;
  return (
    <Band eyebrow="Moments" title="Gallery" aside={<Link to="/gallery" className="more">See more <Icon name="arrow" size={16} className="arrow" /></Link>}>
      <div className="gal-prev">{data.slice(0, 6).map((g) => <Link key={g._id} to="/gallery" className="gp"><img src={g.imageUrl} alt={g.alt} loading="lazy" /></Link>)}</div>
    </Band>
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

/** Two phone screens: the member sign-in and the member dashboard. Rates stay blurred, as they are for visitors. */
const SAMPLE_RATES = [1180, 1221, 1262, 1303];
const SAMPLE_CAI = 55800;
function Phones() {
  const { s } = useSettings();
  const logo = s.site?.logoUrl;
  const mark = (cls = '') => (logo ? <img className={`ph-logo-img ${cls}`} src={logo} alt="" /> : <span className={`ph-logo ${cls}`}>R</span>);
  const { meta } = usePriceMeta();
  const y = meta?.yarn;
  const names = (y?.items || ['6s', '8s', '10s', '12s', '14s']).slice(0, 5);
  return (
    <div className="bc-phones" aria-hidden="true">
      <div className="bc-phone a">
        <div className="bc-notch" />
        <div className="bc-screen login">
          {mark('big')}
          <b>Member sign in</b>
          <small>Recycle Textile Federation</small>
          <div className="ph-field"><i>Email</i></div>
          <div className="ph-field"><i>Password</i><span>••••••••</span></div>
          <div className="ph-btn solid">Sign in</div>
          <div className="ph-or"><i />or<i /></div>
          <div className="ph-btn">Register as a member</div>
        </div>
      </div>
      <div className="bc-phone b">
        <div className="bc-notch" />
        <div className="bc-screen dash">
          <div className="ph-top">{mark()}<b>Home</b><span className="ph-live"><span className="dot" />Sample<span className="ph-d">&nbsp;data</span></span></div>
          <div className="ph-seg"><span className="on">Yarn</span><span>CAI</span><span>Profile</span></div>
          <div className="ph-hero">
            <div className="ph-hero-top"><div><b>Yarn Price List</b><small>Open End · ₹ per kg</small></div><span className="ph-chip">{y?.date ? fmtDate(y.date, { day: 'numeric', month: 'short' }) : 'Today'}</span></div>
            <svg viewBox="0 0 120 34" className="ph-spark" preserveAspectRatio="none"><polyline points="0,26 14,22 28,24 42,15 56,18 70,9 84,13 98,5 120,8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="ph-cards">
            {names.slice(0, 4).map((n, i) => (
              <div key={n} className={`ph-card t${i}`}>
                <span className="ph-card-n">{n}</span>
                <b className="val">₹{SAMPLE_RATES[i % SAMPLE_RATES.length].toLocaleString('en-IN')}</b>
                <small>{i % 2 ? '−₹6' : '+₹12'} today</small>
                <i className={i % 2 ? 'dn' : 'up'}>{i % 2 ? '▼' : '▲'}</i>
              </div>
            ))}
          </div>
          <div className="ph-wide"><span className="ph-wide-ic">₹</span><div><b>CAI Spot Rate</b><small>Spot rate · India</small></div><em>₹{SAMPLE_CAI.toLocaleString('en-IN')}</em></div>
        </div>
      </div>
    </div>
  );
}

export function CtaBand() {
  const { s } = useSettings();
  const join = s.about?.joinUrl;
  return (
    <section className="bc-join">
      <div className="container bc-join-grid">
        <div className="bc-join-copy">
          <p className="bc-eyebrow">Membership</p>
          <h2>Membership is free. All benefits are free.</h2>
          <p>Sign in on your phone to see the daily Yarn and CAI rates, and join the RTF WhatsApp group to get notices first.</p>
          <div className="bc-join-btns">
            <Button size="lg" icon="whatsapp" {...(join ? { href: join } : { to: '/contact' })}>Join RTF</Button>
            <Button variant="glass" size="lg" to="/login">Member login</Button>
          </div>
        </div>
        <Phones />
      </div>
    </section>
  );
}

export default function Home() {
  const { s, ready } = useSettings();
  useSeo('', s.hero?.tagline);
  const root = useRef(null);
  useHomeMotion(root, [ready]);
  if (!ready) return <div className="container page-pad section"><Skeleton h={48} w="60%" /><Skeleton h={300} style={{ marginTop: 24 }} r={12} /></div>;
  return (
    <div ref={root} className="bc-home">
      <div className="bc-progress" aria-hidden="true" />
      <Hero />
      <Intro />
      <Process />
      <Marquee2 />
      <Stories />
      <StatsBand />
      <Pillars />
      <Benefits />
      <News />
      <CtaBand />
      <GalleryPreview />
    </div>
  );
}
