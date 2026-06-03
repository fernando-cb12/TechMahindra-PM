import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { getUserProfile, type UserProfile } from '../services/userService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!session) {
      setProfile(null);
      return;
    }

    void getUserProfile()
      .then((nextProfile) => {
        if (!cancelled) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isAuthenticated: session !== null,
      login: async ({ email, password, persistent }) => {
        const nextSession = await loginRequest({ email, password });
        saveSession(nextSession, persistent);
        setSession(nextSession);
        try {
          const nextProfile = await getUserProfile();
          setProfile(nextProfile);
        } catch {
          setProfile(null);
        }
        return nextSession;
      },
      logout: () => {
        clearSession();
        setSession(null);
        setProfile(null);
      },
      hasRoleAtLeast: (role: AppRole) => {
        if (!session) {
          return false;
        }
        return hasMinimumRole(session.roles, role);
      },
      refreshProfile: async () => {
        if (!session) {
          setProfile(null);
          return null;
        }
        try {
          const nextProfile = await getUserProfile();
          setProfile(nextProfile);
          return nextProfile;
        } catch {
          setProfile(null);
          return null;
        }
      },
      setProfile,
    }),
    [profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
