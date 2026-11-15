import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import Icon from './Icon.jsx';
import { Button } from './Basics.jsx';
import { EASE } from './Motion.jsx';

function useLock(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

export function Modal({ open, onClose, title, children, actions, wide }) {
  const ref = useRef(null);
  const id = useId();
  const rm = useReducedMotion();
  useLock(open);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const f = [...ref.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); prev?.focus?.(); };
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
          <m.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal glass ${wide ? 'wide' : ''}`}
            initial={{ opacity: 0, scale: rm ? 1 : 0.96, y: rm ? 0 : 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: rm ? 1 : 0.98 }} transition={{ duration: 0.25, ease: EASE }}>
            <h3 id={id}>{title}</h3>
            {children}
            {actions && <div className="modal-actions">{actions}</div>}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>, document.body);
}

export function ConfirmModal({ open, title, text, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      actions={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="muted">{text}</p>
    </Modal>
  );
}

export function Dropdown({ label, value, onChange, options, align = 'left', icon, className = '', buttonClass = '' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const rm = useReducedMotion();
  const id = useId();
  const cur = options.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    const out = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, [open]);
  const pick = (o) => { onChange?.(o.value); setOpen(false); ref.current?.querySelector('button')?.focus(); };
  const key = (e) => {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(options[active]); }
    if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
  };
  return (
    <div className={`dd ${className}`} ref={ref} onKeyDown={key}>
      <button type="button" className={`dd-trigger ${buttonClass}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-label={label} onClick={() => setOpen((o) => !o)}>
        {icon && <Icon name={icon} />}
        <span>{cur?.label ?? label}</span>
        <Icon name="chevron" size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <m.div id={id} role="listbox" aria-label={label} className={`dd-menu glass ${align === 'right' ? 'right' : ''}`}
            initial={{ opacity: 0, scale: rm ? 1 : 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: rm ? 1 : 0.97 }} transition={{ duration: 0.16, ease: EASE }}>
            {options.map((o, i) => (
              <button type="button" key={o.value} role="option" aria-selected={o.value === value} data-active={i === active} className="dd-item" onMouseEnter={() => setActive(i)} onClick={() => pick(o)}>
                {o.label}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ToastCtx = createContext({ success() {}, error() {}, info() {} });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const rm = useReducedMotion();
  const push = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l, { id, type, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3500);
  }, []);
  const api = useRef({ success: (t) => push('success', t), error: (t) => push('error', t), info: (t) => push('info', t) }).current;
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" role="status">
        <AnimatePresence>
          {list.map((t) => (
            <m.div key={t.id} layout={false} className={`toast glass ${t.type}`} initial={{ opacity: 0, x: rm ? 0 : 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: rm ? 0 : 40 }} transition={{ duration: 0.3, ease: EASE }}>
              <span className="ic"><Icon name={t.type === 'error' ? 'close' : 'check'} size={16} /></span>
              <span>{t.text}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function Lightbox({ items, index, onClose, onIndex }) {
  const open = index != null && items[index];
  const start = useRef(null);
  useLock(open);
  const go = useCallback((d) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, go, onClose]);
  const it = open ? items[index] : null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div className="lb" role="dialog" aria-modal="true" aria-label="Image viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onPointerDown={(e) => { start.current = e.clientX; }}
          onPointerUp={(e) => { if (start.current != null) { const dx = e.clientX - start.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); start.current = null; } }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <figure style={{ margin: 0, textAlign: 'center' }}>
            <img key={it.src} src={it.src} alt={it.alt || ''} draggable="false" />
            {(it.caption || it.alt) && <figcaption>{it.caption || it.alt}</figcaption>}
          </figure>
          <button className="lb-btn lb-close" aria-label="Close" onClick={onClose} autoFocus><Icon name="close" /></button>
          {items.length > 1 && <>
            <button className="lb-btn lb-prev" aria-label="Previous image" onClick={() => go(-1)}><Icon name="arrow" style={{ transform: 'rotate(180deg)' }} /></button>
            <button className="lb-btn lb-next" aria-label="Next image" onClick={() => go(1)}><Icon name="arrow" /></button>
          </>}
        </m.div>
      )}
    </AnimatePresence>, document.body);
}
