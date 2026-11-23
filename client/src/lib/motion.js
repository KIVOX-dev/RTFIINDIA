import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const OK = '(prefers-reduced-motion: no-preference)';
const EASE = 'power3.out';
const HOVER = '(hover: hover) and (pointer: fine)';

/** Lines of a heading slide up out of a mask, one after another. Runs on load (`scroll: false`) or when it reaches the viewport. */
function revealLines(el, { scroll = true, delay = 0, start = 'top 88%', stagger = 0.1, duration = 1.05 } = {}) {
  return SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'bc-line', autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, {
      yPercent: 118, duration, stagger, delay, ease: 'power4.out',
      ...(scroll ? { scrollTrigger: { trigger: el, start, once: true } } : {}),
    }),
  });
}

/** Hero: masked headline, photo settling in, staggered actions, then the whole block drifts away on scroll. */
export function useHeroMotion(scope) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      gsap.set('.bc-hero-bg', { scale: 1.14, transformOrigin: '50% 50%' });
      revealLines('.bc-hero h1', { scroll: false, delay: 0.3, stagger: 0.14, duration: 1.2 });
      gsap.timeline({ defaults: { ease: EASE } })
        .from('.bc-hero-bg', { scale: 1.34, duration: 2.2, ease: 'power2.out' }, 0)
        .from('.bc-hero-shade', { autoAlpha: 0, duration: 1.2 }, 0)
        .from('.bc-kicker', { y: 18, autoAlpha: 0, duration: 0.7 }, 0.2)
        .from('.bc-hero-cta > *', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 0.95)
        .from('.bc-facts', { autoAlpha: 0, duration: 0.5 }, 1.0)
        .from('.bc-facts > div', { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.09 }, 1.05);
      const out = gsap.timeline({ scrollTrigger: { trigger: '.bc-hero', start: 'top top', end: 'bottom top', scrub: true } });
      out.to('.bc-hero-bg', { yPercent: 9, scale: 1.2, ease: 'none' }, 0)
        .to('.bc-hero-in', { yPercent: -14, autoAlpha: 0.15, ease: 'none' }, 0)
        .to('.bc-facts', { yPercent: -30, autoAlpha: 0, ease: 'none' }, 0);
    });
    return () => mm.revert();
  }, { scope });
}

/** Elements enter once, in small staggered batches. `from` / `to` tune the motion; `deps` re-run it when the targets mount. */
export function useReveal(scope, selector, deps = [], { y = 28, stagger = 0.1, start = 'top 88%', from = null, to = null, duration = 0.85, ease = EASE } = {}) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      const els = gsap.utils.toArray(selector, scope.current);
      if (!els.length) return undefined;
      gsap.set(els, { y, autoAlpha: 0, ...(from || {}) });
      ScrollTrigger.batch(els, {
        start, once: true, interval: 0.1,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration, ease, stagger, overwrite: true, clearProps: 'transform,clipPath', ...(to || {}) }),
      });
      return undefined;
    });
    return () => mm.revert();
  }, { scope, dependencies: deps, revertOnUpdate: true });
}

/** Section headings: masked line reveal on scroll. */
export function useHeadings(scope, selector = 'h2', deps = []) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => { gsap.utils.toArray(selector, scope.current).forEach((el) => revealLines(el)); });
    return () => mm.revert();
  }, { scope, dependencies: deps, revertOnUpdate: true });
}

/** The page-level motion: photographs, parallax, marquee, row focus, join band, scroll progress, magnetic buttons. */
export function useHomeMotion(scope, deps = []) {
  useGSAP(() => {
    if (!scope.current) return undefined;
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      const q = (sel) => gsap.utils.toArray(sel, scope.current);

      // photographs: frame opens like a shutter, image drifts inside it while scrolling
      q('.bc-photo').forEach((frame) => {
        const img = frame.querySelector('img');
        gsap.fromTo(frame, { clipPath: 'inset(12% 12% 12% 12% round 18px)', autoAlpha: 0 }, {
          clipPath: 'inset(0% 0% 0% 0% round 18px)', autoAlpha: 1, duration: 1.2, ease: 'power3.out', clearProps: 'clipPath',
          scrollTrigger: { trigger: frame, start: 'top 90%', once: true },
        });
        if (img) {
          gsap.set(img, { scale: 1.22 });
          gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      });

      // stat tiles: the photograph inside each tile drifts too
      q('.bc-tile-img').forEach((img) => {
        gsap.set(img, { scale: 1.25 });
        gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // "why" rows: the row you are reading lights up, the rest sit back
      const rows = q('.bc-row');
      if (rows.length) {
        const list = rows[0].parentElement;
        list.classList.add('focus-on');
        rows.forEach((row) => ScrollTrigger.create({ trigger: row, start: 'top 62%', end: 'bottom 62%', toggleClass: { targets: row, className: 'is-on' } }));
        gsap.fromTo(list, { '--line': 0 }, { '--line': 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true } });
      }

      // marquee: two lines of outlined type slide in opposite directions with the scroll
      q('.bc-marquee').forEach((band) => {
        q('.bc-marquee-track').forEach((track, i) => {
          if (!band.contains(track)) return;
          gsap.fromTo(track, { xPercent: i % 2 ? -34 : 0 }, { xPercent: i % 2 ? 0 : -34, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
        });
      });

      // join band: photograph drifts, headline lifts out of its mask, buttons pop
      gsap.fromTo('.bc-join-bg', { yPercent: -12, scale: 1.2 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.bc-join', start: 'top bottom', end: 'bottom top', scrub: true } });
      q('.bc-join h2').forEach((el) => revealLines(el, { start: 'top 82%' }));
      gsap.from('.bc-join p, .bc-join-btns > *', { y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: EASE, scrollTrigger: { trigger: '.bc-join', start: 'top 70%', once: true } });

      // content above (members, news, photos) loads after mount and shifts everything: recalculate the scroll positions
      let t;
      const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 200); });
      ro.observe(scope.current);
      window.addEventListener('load', ScrollTrigger.refresh);

      // the two phones in the membership band drift past each other
      gsap.fromTo('.bc-phone.a', { yPercent: 7 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.bc-join', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.bc-phone.b', { yPercent: -7 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.bc-join', start: 'top bottom', end: 'bottom top', scrub: true } });

      // thin progress bar along the top edge
      gsap.to('.bc-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
      return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('load', ScrollTrigger.refresh); };
    });

    // buttons are drawn a little toward the pointer
    mm.add(`${OK} and ${HOVER}`, () => {
      const cleanups = gsap.utils.toArray('.bc-hero-cta .btn, .bc-join-btns .btn', scope.current).map((btn) => {
        const x = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
        const y = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
        const move = (e) => { const r = btn.getBoundingClientRect(); x((e.clientX - (r.left + r.width / 2)) * 0.28); y((e.clientY - (r.top + r.height / 2)) * 0.28); };
        const leave = () => { x(0); y(0); };
        btn.addEventListener('pointermove', move);
        btn.addEventListener('pointerleave', leave);
        return () => { btn.removeEventListener('pointermove', move); btn.removeEventListener('pointerleave', leave); };
      });
      return () => cleanups.forEach((c) => c());
    });
    return () => mm.revert();
  }, { scope, dependencies: deps, revertOnUpdate: true });
}

/** Stacked cards: as each next card slides up over the one before, that one recedes a little. */
export function useStackMotion(scope, count) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(OK, () => {
      const cards = gsap.utils.toArray('.bc-sc', scope.current);
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.94, yPercent: -2, transformOrigin: '50% 0%', ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 82%', end: 'top 110px', scrub: true },
        });
        gsap.fromTo(card.querySelector('.bc-sc-text'), { filter: 'brightness(1)' }, { filter: 'brightness(0.7)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 82%', end: 'top 110px', scrub: true } });
      });
    });
    return () => mm.revert();
  }, { scope, dependencies: [count] });
}
