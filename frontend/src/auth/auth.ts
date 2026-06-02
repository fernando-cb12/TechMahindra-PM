import axios from 'axios';

export const ROLE_LEVELS = {
  VIEW_ONLY: 1,
  DEVELOPER: 2,
  TEAM_LEAD: 3,
  ADMIN: 4,
} as const;

export type AppRole = keyof typeof ROLE_LEVELS;

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAtMs: number;
  email: string;
  roles: AppRole[];
}

const AUTH_STORAGE_KEY = 'collabx.auth.session';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Note: Storing tokens in localStorage or sessionStorage is vulnerable to XSS.
// If backend token refresh is supported in the future, transitioning to HttpOnly
// cookies or short-lived memory tokens is highly recommended.
function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const base64 = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  try {
    return atob(base64);
  } catch {
    throw new Error('Failed to decode base64 string');
  }
}

// Treat decoded JWT data solely as UI hints.
// True authorization validation MUST be enforced on the backend.
function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token: Expected 3 parts');
  }
  const payload = parts[1];
  if (!payload) {
    throw new Error('Invalid token payload');
  }
  try {
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new Error('Failed to parse JWT payload');
  }
}

function parseRoles(payload: Record<string, unknown>): AppRole[] {
  const rolesClaim = payload.roles;
  if (typeof rolesClaim !== 'string' || rolesClaim.trim().length === 0) {
    return [];
  }
  return rolesClaim
    .split(',')
    .map((role) => role.trim() as AppRole)
    // Validate whether the role is a known AppRole
    .filter((role) => role in ROLE_LEVELS);
}

function parseEmail(payload: Record<string, unknown>): string {
  const subject = payload.sub;
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error('Missing email (sub claim) in JWT payload');
  }
  return subject;
}

export function hasMinimumRole(roles: AppRole[], minimumRole: AppRole): boolean {
  const minimumLevel = ROLE_LEVELS[minimumRole];
  if (!minimumLevel) {
    return false;
  }
  return roles.some((role) => {
    const level = ROLE_LEVELS[role];
    return level && level >= minimumLevel;
  });
}

/** True when the user should use the admin panel instead of the main app. */
export function isAdminOnly(roles: AppRole[]): boolean {
  return roles.includes('ADMIN') && !roles.some((role) => role === 'DEVELOPER' || role === 'TEAM_LEAD');
}

export function canAccessMainApp(roles: AppRole[]): boolean {
  return hasMinimumRole(roles, 'DEVELOPER') && !isAdminOnly(roles);
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  let payload: AuthResponse;
  try {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, credentials);
    payload = response.data;
  } catch {
    throw new Error('Invalid email or password');
  }

  const jwtPayload = parseJwtPayload(payload.accessToken);
  const expClaim = typeof jwtPayload.exp === 'number' ? jwtPayload.exp : 0;
  
  const tokenExpiresAtMs = expClaim > 0 ? expClaim * 1000 : Infinity;
  const responseExpiresAtMs = Date.now() + payload.expiresInSeconds * 1000;
  
  const expiresAtMs = Math.min(tokenExpiresAtMs, responseExpiresAtMs);

  if (expiresAtMs <= Date.now()) {
    throw new Error('Received expired token');
  }

  return {
    accessToken: payload.accessToken,
    tokenType: payload.tokenType,
    expiresAtMs,
    email: parseEmail(jwtPayload),
    roles: parseRoles(jwtPayload),
  };
}

export function saveSession(session: AuthSession, persistent: boolean): void {
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  if (persistent) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function loadSession(): AuthSession | null {
  const storedSession =
    localStorage.getItem(AUTH_STORAGE_KEY) ?? sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedSession) {
    return null;
  }
  try {
    const parsed = JSON.parse(storedSession) as AuthSession;
    if (!parsed.accessToken || !parsed.expiresAtMs || parsed.expiresAtMs <= Date.now()) {
      clearSession();
      return null;
    }
    // Defensive sanitization of stored roles just in case local storage contains outdated roles
    parsed.roles = (parsed.roles || []).filter(role => role in ROLE_LEVELS) as AppRole[];
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
