import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../lib/consent.jsx';
import { Icon } from '../ui/index.js';

const CHOICES = [
  { key: 'necessary', title: 'Strictly necessary', text: 'Keeps you signed in, remembers your cookie choice and makes the site work. These cannot be switched off.', locked: true },
  { key: 'preferences', title: 'Preferences', text: 'Remembers small choices that make the site nicer to use, such as skipping the welcome animation on later visits.' },
  { key: 'thirdParty', title: 'Third-party content', text: 'Lets us show content from other services, such as the Google Map in the footer. Those services may set their own cookies.' },
];

/** The consent pop-up: Accept all, Reject optional, or Customise. Reopened from "Cookie settings" in the footer. */
export default function CookieBanner() {
  const c = useConsent();
  const [prefs, setPrefs] = useState({ preferences: c.preferences, thirdParty: c.thirdParty });
  const [custom, setCustom] = useState(false);
  const open = !c.decided || c.panel;

  useEffect(() => { if (open) { setPrefs({ preferences: c.preferences, thirdParty: c.thirdParty }); setCustom(c.panel); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;

  return (
    <div className="ck" role="dialog" aria-modal="false" aria-labelledby="ck-title" aria-describedby="ck-text">
      <div className="ck-head">
        <span className="ck-ic" aria-hidden="true"><Icon name="shield" size={20} /></span>
        <h2 id="ck-title">Your privacy choices</h2>
        {c.decided && <button type="button" className="ck-x" aria-label="Close cookie settings" onClick={c.closeSettings}><Icon name="close" size={18} /></button>}
      </div>
      <p id="ck-text" className="ck-text">
        We use cookies and similar storage to keep you signed in and to make this site work. With your permission we also use them for preferences and to show content from other services.
        Read our <Link to="/cookies">Cookie Policy</Link>, <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms &amp; Conditions</Link>.
      </p>

      {custom && (
        <ul className="ck-list">
          {CHOICES.map((o) => (
            <li key={o.key}>
              <div><b>{o.title}</b><span>{o.text}</span></div>
              <label className="ck-switch">
                <input type="checkbox" checked={o.locked ? true : prefs[o.key]} disabled={o.locked} onChange={(e) => setPrefs((p) => ({ ...p, [o.key]: e.target.checked }))} aria-label={o.title} />
                <i aria-hidden="true" />
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="ck-actions">
        <button type="button" className="ck-btn solid" onClick={c.acceptAll}>Accept all</button>
        {custom
          ? <button type="button" className="ck-btn" onClick={() => c.save(prefs)}>Save my choices</button>
          : <button type="button" className="ck-btn" onClick={c.rejectOptional}>Reject optional</button>}
        {!custom && <button type="button" className="ck-btn ghost" onClick={() => setCustom(true)}>Customise</button>}
      </div>
    </div>
  );
}
