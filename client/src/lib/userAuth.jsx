import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearCache, userAuthApi, userToken } from './api.js';
import { Skeleton } from '../ui/index.js';

const Ctx = createContext({ user: null, ready: false });

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!userToken.get());

  const refresh = useCallback(async () => {
    if (!userToken.get()) { setUser(null); setReady(true); return; }
    try { setUser((await userAuthApi.me()).user); } catch { setUser(null); } finally { setReady(true); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  // Any 401 on a member call (expired token, blocked account) lands here.
  useEffect(() => {
    const lost = () => { clearCache(); setUser(null); setReady(true); };
    window.addEventListener('rtf-user-auth-lost', lost);
    return () => window.removeEventListener('rtf-user-auth-lost', lost);
  }, []);

  const value = useMemo(() => ({
    user, ready, refresh, setUser,
    async login(email, password) {
      const r = await userAuthApi.login(email, password);
      userToken.set(r.token);
      clearCache();
      setUser(r.user);
      return r.user;
    },
    logout() { userToken.clear(); clearCache(); setUser(null); },
  }), [user, ready, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useUser = () => useContext(Ctx);

/** Sends signed-out visitors to /login and brings them back afterwards. */
export function RequireUser({ children }) {
  const { user, ready } = useUser();
  const loc = useLocation();
  if (!ready) return <div className="container page-pad section"><Skeleton h={44} w="40%" /><Skeleton h={260} r={24} style={{ marginTop: 24 }} /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: `${loc.pathname}${loc.search}` }} />;
  return children;
}
