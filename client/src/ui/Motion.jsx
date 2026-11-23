import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { progress } from '../lib/api.js';
import { useSettings } from '../lib/hooks.jsx';
import { hasConsent } from '../lib/consent.jsx';

export const EASE = [0.22, 1, 0.36, 1];
const STATIC_NUMBERS = true; // numbers show their final value (no count-up); set to false to bring the count-up back

/** RTF mark: a ball of yarn. Replaced by the client's uploaded logo (Settings > site.logoUrl) when present. */
export function Logo({ draw = false, size = 40, light = false, showName = false, forceMark = false }) {
  const { s } = useSettings();
  const rm = useReducedMotion();
  const url = !forceMark && s.site?.logoUrl;
  const stroke = light ? '#fff' : 'var(--navy)';
  const P = ({ d, c, w = 3, delay = 0 }) =>
    draw && !rm ? <m.path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay, ease: EASE }} />
      : <path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {url ? (draw && !rm
        ? <m.img src={url} alt="" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: EASE }} style={{ height: size * 1.4, width: 'auto', objectFit: 'contain' }} />
        : <img src={url} alt="" style={{ height: size * 1.4, width: 'auto', objectFit: 'contain' }} />) : (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <P d="M32 8a24 24 0 1 0 0 48 24 24 0 0 0 0-48z" c="var(--blue)" w={4} />
          <P d="M12 38c10-18 22 6 34-12" c={stroke} delay={0.25} />
          <P d="M13 27c11 13 21-14 38 4" c={stroke} delay={0.4} />
          <P d="M22 50c6-8 12-6 20-18" c="var(--cyan)" delay={0.55} />
        </svg>
      )}
      {showName && <span style={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: size * 0.55, color: light ? '#fff' : 'var(--navy)' }}>RTF</span>}
    </span>
  );
}

export function Splash({ ready }) {
  const rm = useReducedMotion();
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem('rtf_splash'); } catch { return true; } });
  const t0 = useRef(performance.now());
  const hide = () => { try { if (hasConsent('preferences')) sessionStorage.setItem('rtf_splash', '1'); } catch { /* storage blocked */ } setShow(false); };
  useEffect(() => { if (!show) return; const t = setTimeout(hide, 1200); return () => clearTimeout(t); }, [show]); // hard cap
  useEffect(() => {
    if (!show || !ready) return;
    const t = setTimeout(hide, Math.max(0, 750 - (performance.now() - t0.current))); // never longer than real load + a short minimum
    return () => clearTimeout(t);
  }, [show, ready]);
  return (
    <AnimatePresence>
      {show && (
        <m.div className="splash" role="status" aria-label="Loading RTF" initial={{ clipPath: 'inset(0 0 0 0)' }}
          exit={rm ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.55, ease: EASE }}>
          {ready ? <Logo draw size={92} light /> : <div style={{ height: 115 }} />}
          <div className="bar"><i /></div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function TopLoader() {
  const [st, setSt] = useState({ v: 0, o: 0, mode: 'idle' });
  useEffect(() => {
    let t;
    const off = progress.subscribe((n) => {
      clearTimeout(t);
      if (n > 0) setSt({ v: 0.85, o: 1, mode: 'slow' });
      else { setSt({ v: 1, o: 1, mode: 'fast' }); t = setTimeout(() => setSt({ v: 0, o: 0, mode: 'reset' }), 280); }
    });
    return () => { off(); clearTimeout(t); };
  }, []);
  const tr = st.mode === 'slow' ? 'transform 6s cubic-bezier(.1,.7,.2,1)' : st.mode === 'fast' ? 'transform .2s, opacity .3s .2s' : 'none';
  return <div className="top-loader" role="progressbar" aria-hidden="true" style={{ transform: `scaleX(${st.v})`, opacity: st.o, transition: tr }} />;
}

/** Route transition: short fade + 12px slide. children is (location) => <Routes location={location}>… */
export function PageTransition({ children }) {
  const loc = useLocation();
  useEffect(() => { progress.inc(); const t = setTimeout(() => progress.dec(), 350); return () => { clearTimeout(t); }; }, [loc.pathname]);
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <m.div key={loc.pathname} initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: EASE }}>
        {children(loc)}
      </m.div>
    </AnimatePresence>
  );
}

// Scroll-reveal animation is switched off site-wide: the only scroll motion is the stacking section boxes on the home page.
export function Reveal({ as: T = 'div', i, y, className, children, ...p }) {
  void i; void y;
  return <T className={className} {...p}>{children}</T>;
}

export function AnimatedNumber({ value, from, duration = 1.1, format = (n) => Math.round(n).toLocaleString('en-IN'), className, onStart }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const rm = useReducedMotion();
  const started = useRef(false);
  const start = from ?? value;
  const [v, setV] = useState(STATIC_NUMBERS || rm ? (value ?? start) : start);
  useEffect(() => {
    if (value == null) return;
    if (started.current) { setV(value); return; }
    if (!inView) return;
    started.current = true;
    onStart?.();
    if (STATIC_NUMBERS || rm) { setV(value); return; }
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setV(start + (value - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, rm]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{value == null ? '–' : format(v)}</span>;
}

export function Marquee({ children, duration = 40, gap = 16, label }) {
  return (
    <div className="marquee" role="group" aria-label={label} style={{ '--dur': `${duration}s`, '--gap': `${gap}px` }}>
      <div className="marquee-track">
        <div className="marquee-set">{children}</div>
        <div className="marquee-set" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
