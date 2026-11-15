import { forwardRef, useId } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export function Button({ variant = 'primary', size, to, href, loading, arrow, icon, children, className = '', disabled, ...p }) {
  const cls = `btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`;
  const body = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} />}
      {children}
      {arrow && <Icon name="arrow" className="arrow" />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...p}>{body}</Link>;
  if (href) return <a href={href} className={cls} {...(/^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...p}>{body}</a>;
  return <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...p}>{body}</button>;
}

export function GlassCard({ as: T = 'div', dark, lift, className = '', children, ...p }) {
  return <T className={`${dark ? 'glass-dark' : 'glass'} ${lift ? 'lift' : ''} ${className}`} {...p}>{children}</T>;
}

export function Pill({ tone = '', color, children, className = '', icon, ...p }) {
  const style = color ? { background: `color-mix(in srgb, ${color} 16%, white)`, color: 'var(--navy)' } : undefined;
  return <span className={`pill ${tone} ${className}`} style={style} {...p}>{icon && <Icon name={icon} size={14} />}{children}</span>;
}

export function Skeleton({ w = '100%', h = 16, r, style, className = '' }) {
  return <span className={`skel ${className}`} aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
export const SkeletonRows = ({ n = 6 }) => (
  <div role="status" aria-label="Loading" style={{ display: 'grid', gap: 14, padding: 20 }}>
    {Array.from({ length: n }, (_, i) => <div key={i} className="row"><Skeleton w="30%" h={18} /><span className="spacer" /><Skeleton w="18%" h={18} /><Skeleton w="14%" h={22} r={999} /></div>)}
  </div>
);
export const SkeletonCard = ({ image = true }) => (
  <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--r-4)' }} role="status" aria-label="Loading">
    {image && <Skeleton h={170} r={0} />}
    <div style={{ padding: 20, display: 'grid', gap: 12 }}>
      <Skeleton w={90} h={22} r={999} /><Skeleton h={22} /><Skeleton w="70%" h={22} /><Skeleton h={14} /><Skeleton w="80%" h={14} />
    </div>
  </div>
);

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 120 96" fill="none" aria-hidden="true">
        <rect x="14" y="14" width="92" height="68" rx="14" fill="#EAF3FF" stroke="#3395FF" strokeWidth="2" />
        <path d="M30 62l16-16 12 12 10-10 22 22" stroke="#3395FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="34" r="6" fill="#38D4FF" />
      </svg>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, className = '', id, ...p }, ref) {
  const uid = useId(); const i = id || uid;
  return (
    <div className={`field ${error ? 'err' : ''} ${className}`}>
      <input ref={ref} id={i} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${i}-e` : undefined} {...p} />
      <label htmlFor={i}>{label}</label>
      {error && <span className="msg" id={`${i}-e`} role="alert">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
});
export function Textarea({ label, error, hint, className = '', id, ...p }) {
  const uid = useId(); const i = id || uid;
  return (
    <div className={`field ${error ? 'err' : ''} ${className}`}>
      <textarea id={i} placeholder=" " aria-invalid={!!error} aria-describedby={error ? `${i}-e` : undefined} {...p} />
      <label htmlFor={i}>{label}</label>
      {error && <span className="msg" id={`${i}-e`} role="alert">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
export function Select({ label, error, options = [], className = '', id, children, ...p }) {
  const uid = useId(); const i = id || uid;
  return (
    <div className={`field ${error ? 'err' : ''} ${className}`}>
      <select id={i} aria-invalid={!!error} {...p}>
        {children || options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <label htmlFor={i}>{label}</label>
      {error && <span className="msg" role="alert">{error}</span>}
    </div>
  );
}
export function Switch({ label, checked, onChange, ...p }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} {...p} />
      <span className="track" aria-hidden="true" />
      {label}
    </label>
  );
}
