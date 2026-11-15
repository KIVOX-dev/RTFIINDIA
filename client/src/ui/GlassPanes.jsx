// Slanted glass slats (Razorpay-style backdrop). Pure CSS motion: only transform + opacity are animated.
// 46 slats of identical width, so the lines are evenly spaced
const W = Array.from({ length: 46 }, () => 4);
const STOPS = [[0, [150, 236, 255]], [0.25, [118, 222, 255]], [0.5, [196, 246, 255]], [0.75, [158, 206, 255]], [1, [116, 172, 255]]];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function tone(t) {
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (t <= t1) return mix(c0, c1, (t - t0) / (t1 - t0));
  }
  return STOPS[STOPS.length - 1][1];
}

export default function GlassPanes({ className = '' }) {
  const total = W.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <div className={`gp-wrap ${className}`} aria-hidden="true">
      <div className="gp-par">
        <div className="gp-skew">
          {W.map((w, i) => {
            const t = (acc + w / 2) / total;
            acc += w;
            const c = tone(t);
            const light = mix(c, [255, 255, 255], 0.6);
            const a = Math.min(1, 0.6 + t * 1.2);
            return (
              <i key={i} className="gp-pane" style={{ '--w': w, '--d': `${(i * 0.16).toFixed(2)}s`, background: `linear-gradient(90deg, rgba(${c},${a}) 0%, rgba(${light},${Math.min(1, a * 0.9)}) 100%)` }} />
            );
          })}
        </div>
        <i className="gp-sheen" />
      </div>
      <i className="gp-wash" />
    </div>
  );
}
