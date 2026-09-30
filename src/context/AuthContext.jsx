import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStorage } from '../api/client';
import * as authApi from '../api/auth';
import { getMyCompany } from '../api/companies';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [company, setCompany] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadCompany = useCallback(async () => {
    try {
      const data = await getMyCompany();
      setCompany(data);
      return data;
    } catch (err) {
      setCompany(null);
      return null;
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (tokenStorage.getAccessToken() && tokenStorage.getUser()) {
        await loadCompany();
      }
      setInitializing(false);
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (credentials) => {
      const result = await authApi.login(credentials);
      tokenStorage.setSession(result);
      setUser(result.user);
      await loadCompany();
      return result;
    },
    [loadCompany],
  );

  const completeVerification = useCallback(
    async (result) => {
      tokenStorage.setSession(result);
      setUser(result.user);
      await loadCompany();
    },
    [loadCompany],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setCompany(null);
  }, []);

  const refreshCompany = useCallback(() => loadCompany(), [loadCompany]);

  const value = useMemo(
    () => ({
      user,
      company,
      initializing,
      isAuthenticated: Boolean(user),
      // A brand-new account is initialized with name = 'New Business' & business_type = 'company'
      // in backend auth.service.js until onboarding sets the real name and business type.
      needsBusinessType: Boolean(company && company.name === 'New Business' && company.business_type === 'company'),
      login,
      logout,
      completeVerification,
      refreshCompany,
    }),
    [user, company, initializing, login, logout, completeVerification, refreshCompany],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
