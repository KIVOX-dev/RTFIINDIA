import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** Cookie and storage consent. "Necessary" is always on; the rest start off until the visitor chooses. */
const KEY = 'rtf_consent';
const VERSION = 1;
const OFF = { preferences: false, thirdParty: false };

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && v.version === VERSION) return { ...OFF, preferences: !!v.preferences, thirdParty: !!v.thirdParty, decided: true };
  } catch { /* storage blocked or corrupt */ }
  return { ...OFF, decided: false };
};

const Ctx = createContext(null);

export function ConsentProvider({ children }) {
  const [state, setState] = useState(read);
  const [panel, setPanel] = useState(false); // the customise panel is open

  const save = useCallback((next) => {
    const v = { preferences: !!next.preferences, thirdParty: !!next.thirdParty };
    try { localStorage.setItem(KEY, JSON.stringify({ ...v, version: VERSION, at: new Date().toISOString() })); } catch { /* storage blocked */ }
    setState({ ...v, decided: true });
    setPanel(false);
  }, []);

  const value = useMemo(() => ({
    ...state,
    panel,
    openSettings: () => setPanel(true),
    closeSettings: () => setPanel(false),
    acceptAll: () => save({ preferences: true, thirdParty: true }),
    rejectOptional: () => save(OFF),
    save,
    /** Allow third-party content (such as the map) without touching the other choices. */
    allowThirdParty: () => save({ preferences: state.preferences, thirdParty: true }),
  }), [state, panel, save]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useConsent must be used inside ConsentProvider');
  return c;
}

/** Read a consent choice outside React (for example before writing optional storage). */
export function hasConsent(kind) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return !!(v && v.version === VERSION && v[kind]);
  } catch { return false; }
}
