import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Bizgen-style motion layer (GSAP + SplitText + ScrollTrigger + Lenis smooth scroll).
 * Mount <BizgenMotion /> once. It watches the DOM, so pages that load data later are animated
 * without any per-page code. Opt out per element with data-bz="off".
 */
const HEADINGS = 'main h1, main h2, main .bz-title';
const FADE_UP = [
  'main .section-head > p', 'main .eyebrow', 'main .lift', 'main .glass.lift', 'main .bz-fade',
  'main .btn-lg', 'main .textlink', 'main .illus', 'main img.bz-img',
].join(',');
const EASE = 'power4.out';

const off = (el) => el.closest('[data-bz="off"]') || el.dataset.bz;

function splitHeading(el) {
  el.dataset.bz = 'split';
  SplitText.create(el, {
    type: 'lines,words',
    mask: 'lines',
    linesClass: 'bz-line',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.words, {
        yPercent: 110, rotate: 4, opacity: 0, duration: 1, ease: EASE, stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    },
  });
}

function scan() {
  // headings: split leaf-text elements (h1 with inner spans -> split the spans)
  document.querySelectorAll(HEADINGS).forEach((h) => {
    if (off(h)) return;
    const leaves = h.children.length ? [...h.querySelectorAll(':scope > span, :scope > em, :scope > b')].filter((c) => !c.children.length) : [h];
    if (leaves[0] !== h) h.dataset.bz = 'done';
    leaves.forEach((l) => { if (l.textContent.trim() && !l.dataset.bz) splitHeading(l); });
  });
  // everything else: fade + rise, staggered within each row of siblings
  const fresh = [...document.querySelectorAll(FADE_UP)].filter((el) => !off(el));
  fresh.forEach((el) => {
    el.dataset.bz = 'fade';
    const sibs = [...el.parentElement.children].filter((c) => c.matches(FADE_UP));
    const delay = Math.min(sibs.indexOf(el), 5) * 0.09;
    gsap.fromTo(el, { y: 44, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: EASE, delay, clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 93%', once: true },
    });
  });
}

export function BizgenMotion() {
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) return undefined; // static, fully readable page

    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis');

    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(scan, 120); };
    const mo = new MutationObserver(schedule);
    mo.observe(document.getElementById('root'), { childList: true, subtree: true });
    schedule();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(timer); mo.disconnect(); gsap.ticker.remove(tick); lenis.destroy();
      document.documentElement.classList.remove('lenis');
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
  return null;
}
