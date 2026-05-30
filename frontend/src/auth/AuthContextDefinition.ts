import { createContext } from 'react';
import type { AppRole, AuthSession } from './auth';

interface LoginInput {
  email: string;
  password: string;
  persistent: boolean;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => void;
  hasRoleAtLeast: (role: AppRole) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
