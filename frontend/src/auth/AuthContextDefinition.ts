import { createContext } from 'react';
import type { AppRole, AuthSession } from './auth';
import type { UserProfile } from '../services/userService';

interface LoginInput {
  email: string;
  password: string;
  persistent: boolean;
}

export interface AuthContextValue {
  session: AuthSession | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => void;
  hasRoleAtLeast: (role: AppRole) => boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  setProfile: (profile: UserProfile | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
