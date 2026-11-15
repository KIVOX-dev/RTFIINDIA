// Live cotton-industry backdrop: swaying cotton bolls, drifting fibres and flowing yarn threads.
// Original artwork (SVG + CSS). Only transform / opacity are animated.
function Boll({ id }) {
  return (
    <svg viewBox="0 0 120 134" aria-hidden="true">
      <defs>
        <radialGradient id={`cb${id}`} cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#eef3fb" /><stop offset="1" stopColor="#c3d3ea" /></radialGradient>
        <linearGradient id={`cg${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a9a66" /><stop offset="1" stopColor="#2c6a45" /></linearGradient>
      </defs>
      <path d="M60 84 C28 88 14 108 18 130 C38 124 52 110 60 92 Z" fill={`url(#cg${id})`} />
      <path d="M60 84 C92 88 106 108 102 130 C82 124 68 110 60 92 Z" fill={`url(#cg${id})`} opacity="0.92" />
      <path d="M60 92 C50 108 49 122 60 132 C71 122 70 108 60 92 Z" fill="#3f8a5a" />
      <g fill={`url(#cb${id})`} stroke="rgba(90,125,185,0.4)" strokeWidth="1.4">
        <circle cx="34" cy="64" r="23" /><circle cx="86" cy="64" r="23" />
        <circle cx="60" cy="26" r="25" /><circle cx="36" cy="40" r="25" /><circle cx="84" cy="40" r="25" />
        <circle cx="60" cy="58" r="30" />
      </g>
      <g fill="none" stroke="rgba(120,150,200,0.22)" strokeWidth="1.4" strokeLinecap="round">
        <path d="M44 34c6-6 14-6 20 0M70 52c6-5 13-4 18 2M40 60c5 5 12 6 18 2" />
      </g>
    </svg>
  );
}

const BOLLS = [
  { x: '57%', y: '-6%', s: 120, r: -14, d: 0, t: 9 }, { x: '90%', y: '2%', s: 170, r: 12, d: -2, t: 11 },
  { x: '66%', y: '72%', s: 140, r: 8, d: -4, t: 10 }, { x: '92%', y: '60%', s: 124, r: -10, d: -1, t: 8 },
  { x: '1%', y: '64%', s: 130, r: -16, d: -3, t: 10 }, { x: '44%', y: '78%', s: 96, r: 10, d: -5, t: 12 },
  { x: '47%', y: '8%', s: 84, r: 18, d: -6, t: 9 }, { x: '23%', y: '86%', s: 70, r: -8, d: -7, t: 11 },
];
const FIBRES = Array.from({ length: 16 }, (_, i) => ({ x: `${(i * 37 + 6) % 96}%`, s: 8 + ((i * 7) % 14), d: -((i * 1.7) % 14), t: 12 + ((i * 5) % 9) }));
const WAVE = 'M0 60 C150 0 450 0 600 60 C750 120 1050 120 1200 60';

function Thread({ top, color, op, dur, w = 1.6, flip }) {
  return (
    <svg className="cf-thread" style={{ top, '--dur': `${dur}s`, opacity: op, transform: flip ? 'scaleY(-1)' : undefined }} viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">
      <g className="cf-thread-in" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
        <path d={WAVE} /><path d={WAVE} transform="translate(1200 0)" />
      </g>
    </svg>
  );
}

export default function CottonField({ className = '' }) {
  return (
    <div className={`cf ${className}`} aria-hidden="true">
      <i className="cf-glow a" /><i className="cf-glow b" />
      <Thread top="12%" color="#7fb2ff" op={0.5} dur={46} />
      <Thread top="34%" color="#3395ff" op={0.28} dur={62} w={1.2} flip />
      <Thread top="58%" color="#f2c99a" op={0.55} dur={54} w={2} />
      <Thread top="76%" color="#9fd0ff" op={0.5} dur={70} w={1.4} flip />
      {FIBRES.map((f, i) => <i key={i} className="cf-fibre" style={{ left: f.x, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.t}s` }} />)}
      {BOLLS.map((b, i) => (
        <div key={i} className="cf-boll" style={{ left: b.x, top: b.y, width: b.s, '--r': `${b.r}deg`, animationDelay: `${b.d}s`, animationDuration: `${b.t}s` }}>
          <Boll id={i} />
        </div>
      ))}
    </div>
  );
}
