/** Small illustrated icons: dark outline, pale-blue fills, one warm accent. Original artwork, drawn for RTF. */
const INK = '#1f2937';
const BLUE = '#8cc8ee';
const PALE = '#e3f2fb';
const WARM = '#f5a524';

const base = { fill: 'none', stroke: INK, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ART = {
  /** a garment: textile waste */
  waste: (
    <>
      <path {...base} fill={PALE} d="M23 11 10 17l5 11 7-3v28h20V25l7 3 5-11-13-6c-2 4-14 4-16 0Z" />
      <path {...base} stroke={BLUE} d="M28 36h8M28 42h8" />
      <circle cx="49" cy="49" r="5" fill={WARM} stroke={INK} strokeWidth="2" />
      <path {...base} strokeWidth="1.8" d="M47 49h4M49 47v4" />
    </>
  ),
  /** a mill with a gear: recycling */
  recycle: (
    <>
      <path {...base} fill={PALE} d="M8 54V32l14 8v-8l14 8V24h12v30Z" />
      <path {...base} fill={BLUE} d="M42 24V12h8v12" />
      <path {...base} d="M14 46h6M28 46h6M40 40h2M44 40h2" stroke={INK} />
      <circle cx="19" cy="16" r="6" fill={BLUE} stroke={INK} strokeWidth="2" />
      <path {...base} d="M19 7v3M19 22v3M10 16h3M25 16h3M12.6 9.6l2 2M23.4 20.4l2 2M25.4 9.6l-2 2M12.6 22.4l2-2" />
      <circle cx="53" cy="8" r="2" fill={WARM} />
    </>
  ),
  /** a cone of yarn */
  yarn: (
    <>
      <ellipse {...base} cx="34" cy="14" rx="7" ry="3" fill={PALE} />
      <path {...base} fill={PALE} d="m27 14-6 38h26l-6-38" />
      <ellipse {...base} cx="34" cy="52" rx="13" ry="3.5" fill={BLUE} />
      <path {...base} stroke={BLUE} d="M26 26c5 3 11 3 16 0M24 36c6 3.500 14 3.500 20 0M22.500 46c7 3.500 17 3.500 24 0" />
      <path {...base} stroke={WARM} d="M47 52c8 1 9-8 4-10" />
    </>
  ),
  /** a spinning mill: saw-tooth roof and chimney */
  mill: (
    <>
      <path {...base} fill={PALE} d="M6 54V30l12-8v8l12-8v8l12-8v32Z" />
      <path {...base} fill={BLUE} d="M46 54V12h10v42" />
      <path {...base} d="M12 54V42h8v12M26 40h8v8h-8Z" />
      <circle cx="51" cy="7" r="2.500" fill={WARM} />
      <path {...base} stroke={BLUE} d="M40 38h0" />
    </>
  ),
  /** a powerloom: warp threads and a shuttle */
  powerloom: (
    <>
      <path {...base} fill={PALE} d="M10 10h44v44H10Z" />
      <path {...base} stroke={BLUE} d="M20 10v44M28 10v44M36 10v44M44 10v44" />
      <path {...base} fill={BLUE} d="M10 32c8-4 12 4 22 0s14 4 22 0v10c-8 4-12-4-22 0s-14-4-22 0Z" />
      <ellipse cx="32" cy="22" rx="9" ry="3.500" fill={WARM} stroke={INK} strokeWidth="2" />
    </>
  ),
  /** a handloom: a woven cloth with a spool */
  handloom: (
    <>
      <path {...base} fill={PALE} d="M8 16c10-6 22 6 40-2v28c-18 8-30-4-40 2Z" />
      <path {...base} stroke={BLUE} d="M8 26c10-6 22 6 40-2M8 36c10-6 22 6 40-2M22 17v28M34 18v28" />
      <rect x="44" y="40" width="12" height="16" rx="2" fill={WARM} stroke={INK} strokeWidth="2" />
      <path {...base} d="M44 46h12M44 50h12" />
    </>
  ),
  /** rising bars: daily rates */
  chart: (
    <>
      <path {...base} d="M10 10v44h44" />
      <rect x="17" y="36" width="8" height="18" rx="1.500" fill={BLUE} stroke={INK} strokeWidth="2" />
      <rect x="29" y="28" width="8" height="26" rx="1.500" fill={PALE} stroke={INK} strokeWidth="2" />
      <rect x="41" y="20" width="8" height="34" rx="1.500" fill={BLUE} stroke={INK} strokeWidth="2" />
      <path {...base} stroke={WARM} strokeWidth="2.500" d="m15 28 14-8 11-8 14-4" />
      <circle cx="54" cy="8" r="3" fill={WARM} stroke={INK} strokeWidth="2" />
    </>
  ),
  /** two speech bubbles: the WhatsApp group */
  chat: (
    <>
      <path {...base} fill={PALE} d="M10 12h30a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H24l-8 7v-7h-6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z" />
      <path {...base} fill={BLUE} d="M26 28h26a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4v7l-8-7H26a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4Z" />
      <circle cx="31" cy="39" r="2" fill={INK} /><circle cx="39" cy="39" r="2" fill={INK} /><circle cx="47" cy="39" r="2" fill={WARM} stroke={INK} strokeWidth="1.500" />
    </>
  ),
  /** people round a table: committee meetings */
  people: (
    <>
      <circle cx="22" cy="18" r="6" fill={PALE} stroke={INK} strokeWidth="2" />
      <circle cx="42" cy="18" r="6" fill={BLUE} stroke={INK} strokeWidth="2" />
      <path {...base} fill={BLUE} d="M11 42c0-9 6-13 11-13s11 4 11 13Z" />
      <path {...base} fill={PALE} d="M31 42c0-9 6-13 11-13s11 4 11 13Z" />
      <path {...base} fill={WARM} d="M6 44h52v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" />
    </>
  ),
  /** a globe with a pin: buyers and fairs */
  globe: (
    <>
      <circle cx="30" cy="32" r="22" fill={PALE} stroke={INK} strokeWidth="2" />
      <ellipse {...base} cx="30" cy="32" rx="9" ry="22" />
      <path {...base} stroke={BLUE} d="M8 32h44M12 20h36M12 44h36" />
      <path {...base} fill={WARM} d="M48 8a7 7 0 0 1 7 7c0 6-7 13-7 13s-7-7-7-13a7 7 0 0 1 7-7Z" />
      <circle cx="48" cy="15" r="2.500" fill="#fff" stroke={INK} strokeWidth="1.500" />
    </>
  ),
  /** a newspaper: daily news and awards */
  news: (
    <>
      <path {...base} fill={PALE} d="M10 12h36v38a4 4 0 0 0 4 4H14a4 4 0 0 1-4-4Z" />
      <path {...base} fill={BLUE} d="M46 22h8v28a4 4 0 0 1-4 4" />
      <rect x="16" y="18" width="14" height="12" rx="1.500" fill={BLUE} stroke={INK} strokeWidth="2" />
      <path {...base} d="M34 20h6M34 26h6M16 36h24M16 42h24M16 48h14" />
      <circle cx="50" cy="12" r="3" fill={WARM} stroke={INK} strokeWidth="2" />
    </>
  ),
  /** a price tag with sparkles: free membership */
  free: (
    <>
      <path {...base} fill={PALE} d="M8 10h22l26 26-20 20L8 30Z" />
      <circle cx="19" cy="21" r="4" fill={WARM} stroke={INK} strokeWidth="2" />
      <path {...base} stroke={BLUE} d="m26 34 12 12M32 28l12 12" />
      <path {...base} stroke={WARM} d="M52 8v8M48 12h8M56 22v5M53.500 24.500h5" />
    </>
  ),
  /** fallback: a spool */
  spool: (
    <>
      <path {...base} fill={BLUE} d="M16 12h32v6H16ZM16 46h32v6H16Z" />
      <path {...base} fill={PALE} d="M20 18h24v28H20Z" />
      <path {...base} stroke={WARM} d="M20 26h24M20 33h24M20 40h24" />
    </>
  ),
};

export const SPOTS = Object.keys(ART);

export default function Spot({ name = 'spool', size = 56, className = '' }) {
  return (
    <svg className={`spot ${className}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      {ART[name] || ART.spool}
    </svg>
  );
}
