import { useMemo, useState, type ReactNode } from 'react';
import {
  clearSession,
  hasMinimumRole,
  loadSession,
  login as loginRequest,
  saveSession,
  type AppRole,
  type AuthSession,
} from './auth';
import { AuthContext, type AuthContextValue } from './AuthContextDefinition';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login: async ({ email, password, persistent }) => {
        const nextSession = await loginRequest({ email, password });
        saveSession(nextSession, persistent);
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        clearSession();
        setSession(null);
      },
      hasRoleAtLeast: (role: AppRole) => {
        if (!session) {
          return false;
        }
        return hasMinimumRole(session.roles, role);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
