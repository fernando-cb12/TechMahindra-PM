import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  clearSession,
  hasMinimumRole,
  loadSession,
  login as loginRequest,
  saveSession,
  type AppRole,
  type AuthSession,
} from './auth';

interface LoginInput {
  email: string;
  password: string;
  persistent: boolean;
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => void;
  hasRoleAtLeast: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login: async ({ email, password, persistent }: LoginInput) => {
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
