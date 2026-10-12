'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/admin/api';
import { accountRequest, checkedAccount, type AccountUser } from '@/lib/account/api';
type Session = { status: 'loading' | 'anonymous' | 'authenticated' | 'error'; user: AccountUser | null };
const Context = createContext<{session: Session; refresh: () => Promise<void>; logout: () => Promise<void>} | null>(null);
export function AccountSessionProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<Session>({status:'loading', user:null});
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try { const result = await accountRequest<{data:{user:AccountUser}}>('me'); const user = checkedAccount(result.data.user); if (request === generation.current) setSession({status:'authenticated',user}); }
    catch (error) { if (request === generation.current) setSession({status:error instanceof ApiError && error.status === 401 ? 'anonymous' : 'error',user:null}); }
  }, []);
  const invalidate = useCallback(() => { ++generation.current; }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); const resume = () => { if (document.visibilityState === 'visible') void refresh(); }; document.addEventListener('visibilitychange',resume); return () => { window.clearTimeout(initial); invalidate(); document.removeEventListener('visibilitychange',resume); }; },[refresh,invalidate]);
  async function logout() {
    try { await accountRequest('logout','POST',{}); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    ++generation.current; setSession({status:'anonymous',user:null});
  }
  return <Context.Provider value={{session,refresh,logout}}>{children}</Context.Provider>;
}
export function useAccountSession() { const context = useContext(Context); if (!context) throw new Error('Account provider missing'); return context; }
