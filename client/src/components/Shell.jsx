import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon, Logo, Button, Dropdown, EASE } from '../ui/index.js';
import { useSettings, usePriceMeta } from '../lib/hooks.jsx';
import { useUser } from '../lib/userAuth.jsx';
import { useConsent } from '../lib/consent.jsx';
import { fmtDate } from '../lib/format.js';

const SOCIAL = [['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube'], ['facebook', 'Facebook']];
const PRICES = [['/prices/yarn', 'Yarn Price List'], ['/prices/cai', 'CAI Spot Rate'], ['/reference', 'Reference charts']]; // price links open the member dashboard (or the sign-in teaser)
const MORE = [['/blog', 'Blog'], ['/events', 'Events'], ['/awards', 'RTF Awards'], ['/gallery', 'Gallery'], ['/members/grey-yarn', 'Grey Yarn Members']];

function NavMenu({ label, items, active }) {
  const [open, setOpen] = useState(false);
  const rm = useReducedMotion();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <div className="nav-dd" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" className={`nav-link ${active ? 'active' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}<Icon name="chevron" size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <m.ul role="menu" className="nav-menu glass" initial={{ opacity: 0, scale: rm ? 1 : 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: rm ? 1 : 0.97 }} transition={{ duration: 0.16, ease: EASE }}>
            {items.map(([to, text]) => <li key={to} role="none"><Link role="menuitem" to={to}>{text}</Link></li>)}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Announce() {
  const { s } = useSettings();
  const { meta } = usePriceMeta();
  const { user } = useUser();
  const live = meta?.yarn?.isToday;
  return (
    <div className="announce no-print">
      <div className="container announce-in">
        <b>{s.site?.short || 'RTF'} rates</b>
        <span className="announce-msg">
          {live ? `Today's rates (${fmtDate(meta.yarn.date, { day: 'numeric', month: 'long' })}) are out. ${user ? 'Open your dashboard to view them.' : 'Sign in to view.'}` : 'Daily Open End yarn and CAI spot rates for RTF members'}
        </span>
        <Link to={user ? '/dashboard' : '/login'} className="announce-btn">{user ? 'View rates' : 'Member login'}</Link>
      </div>
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useUser();
  const nav = useNavigate();
  if (!user) return <Button to="/login" variant="glass" size="sm" className="hdr-cta hdr-login" icon="lock">Member Login</Button>;
  return (
    <>
      <Button to="/dashboard" variant="glass" size="sm" className="hdr-cta hdr-login">Dashboard</Button>
      <Dropdown label="Account" align="right" value="" buttonClass="avatar-btn hdr-login" icon="users"
        onChange={(v) => (v === 'out' ? (logout(), nav('/')) : nav(v === 'profile' ? '/dashboard?tab=profile' : '/dashboard'))}
        options={[{ value: 'dash', label: user.name }, { value: 'profile', label: 'Profile' }, { value: 'out', label: 'Sign out' }]} />
    </>
  );
}

export function Header() {
  const { s } = useSettings();
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const loc = useLocation();
  const rm = useReducedMotion();
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => setSheet(false), [loc.pathname]);
  useEffect(() => { document.body.style.overflow = sheet ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [sheet]);
  const at = (p) => loc.pathname.startsWith(p);
  return (
    <header className={`site-header ${scrolled && loc.pathname !== '/' ? 'scrolled' : ''} ${loc.pathname === '/' ? 'is-static' : ''}`}>
      <div className="container bar">
        <Link to="/" className="brand" aria-label={`${s.site?.name || 'RTF'} home`}>
          <Logo size={scrolled ? 42 : 56} />
          <span className="brand-text"><b>RTF</b><small>{s.site?.name}</small></span>
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/about" className="nav-link">About</NavLink>
          <NavMenu label="Prices" items={PRICES} active={at('/prices') || at('/reference')} />
          <NavLink to="/news" className="nav-link">News</NavLink>
          <NavLink to="/contact" className="nav-link">Contact</NavLink>
          <NavMenu label="More" items={MORE} active={MORE.some(([p]) => at(p))} />
        </nav>
        <AccountMenu />
        <Button to="/about" size="sm" className="hdr-cta" arrow>Join RTF</Button>
        <button className="burger" aria-label="Open menu" aria-expanded={sheet} onClick={() => setSheet(true)}><Icon name="menu" size={26} /></button>
      </div>
      <AnimatePresence>
        {sheet && (
          <m.div className="sheet glass" role="dialog" aria-modal="true" aria-label="Menu" initial={{ opacity: 0, y: rm ? 0 : -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
            <div className="sheet-top">
              <Logo size={36} showName />
              <button className="burger" aria-label="Close menu" onClick={() => setSheet(false)}><Icon name="close" size={26} /></button>
            </div>
            <nav aria-label="Mobile">
              {[['/', 'Home'], ['/about', 'About'], ['/prices/yarn', 'Yarn Price List'], ['/prices/cai', 'CAI Spot Rate'], ['/news', 'News'], ...MORE, ['/reference', 'Reference charts'], ['/contact', 'Contact'], user ? ['/dashboard', 'My dashboard'] : ['/login', 'Member login']].map(([to, t], i) => (
                <m.div key={to} initial={{ opacity: 0, x: rm ? 0 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, ease: EASE }}>
                  <Link to={to} className="sheet-link">{t}<Icon name="arrow" size={18} /></Link>
                </m.div>
              ))}
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Google Map of the office. It loads only after the visitor allows third-party content. */
const OFFICE_PLACE = '6, Vellanaipatti Main Rd, Karuparayanpalayam, Coimbatore, Tamil Nadu 641048'; // the RTF office pin
const OFFICE_LINK = 'https://maps.app.goo.gl/ZAkcqxrGwN9FEnpE7';
function MapEmbed({ mapUrl }) {
  const consent = useConsent();
  const q = encodeURIComponent(OFFICE_PLACE);
  // an embed link pasted in Admin (Contact > map URL) wins; otherwise the office pin above
  const embed = mapUrl && /\/maps\/embed|output=embed/.test(mapUrl) ? mapUrl : `https://www.google.com/maps?q=${q}&z=17&output=embed`;
  const open = mapUrl && !/\/maps\/embed|output=embed/.test(mapUrl) ? mapUrl : OFFICE_LINK;
  return (
    <div className="foot-map">
      {consent.thirdParty ? (
        <iframe title="Map showing the RTF office" src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <div className="foot-map-off">
          <Icon name="loc" size={26} />
          <p>The map is provided by Google, which may set cookies. Load it only if you are happy with that.</p>
          <button type="button" className="foot-map-btn" onClick={consent.allowThirdParty}>Load Google Map</button>
        </div>
      )}
      <a className="foot-dir" href={open} target="_blank" rel="noopener noreferrer">Get directions <Icon name="arrow" size={16} className="arrow" /></a>
    </div>
  );
}

export function Footer() {
  const { s } = useSettings();
  const consent = useConsent();
  const c = s.contact || {}, soc = s.social || {};
  return (
    <footer className="site-footer">
      <img className="foot-bg" src="/photos/cotton-aerial.webp" alt="" aria-hidden="true" loading="lazy" />
      <div className="container foot-grid">
        <div className="foot-brand">
          <Logo size={52} light />
          <p className="foot-about">{s.hero?.tagline}</p>
          <div className="socials" aria-label="Social links">
            {SOCIAL.map(([k, name]) => soc[k] ? <a key={k} href={soc[k]} target="_blank" rel="noopener noreferrer" aria-label={name}><Icon name={k} /></a>
              : <span key={k} className="off" title={`${name} link not set yet`} aria-hidden="true"><Icon name={k} /></span>)}
          </div>
        </div>
        <div>
          <h4>Quick links</h4>
          <ul>{[['/', 'Home'], ['/about', 'About Us'], ['/prices/yarn', 'Yarn Price List'], ['/prices/cai', 'CAI Spot Rate'], ['/gallery', 'Gallery'], ['/contact', 'Contact Us']].map(([to, t]) => <li key={to}><Link to={to}>{t}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/cookies">Cookie Policy</Link></li>
            <li><button type="button" className="foot-link-btn" onClick={consent.openSettings}>Cookie settings</button></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul className="foot-contact">
            <li style={{ whiteSpace: 'pre-line' }}>{c.address || 'Coimbatore, Tamil Nadu'}</li>
            {c.email && <li><a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.phone && <li><a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></li>}
          </ul>
        </div>
      </div>
      <div className="container foot-mapband"><MapEmbed mapUrl={c.mapUrl} /></div>
      <div className="container foot-bar">
        <span>© {new Date().getFullYear()} {s.site?.name}. All rights reserved.</span>
        <nav className="foot-legal" aria-label="Legal">
          <Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/cookies">Cookies</Link>
        </nav>
        <span>{s.footer?.credit} <Link to="/admin" className="foot-admin">Admin</Link></span>
      </div>
    </footer>
  );
}

export function ErrorCard({ title = 'Something went wrong', text = 'Please check your connection and try again.', onRetry }) {
  return (
    <div className="container page-pad section">
      <div className="glass err-card">
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          {onRetry && <Button onClick={onRetry} icon="refresh">Try again</Button>}
          <Button to="/" variant="glass">Go home</Button>
        </div>
      </div>
    </div>
  );
}
