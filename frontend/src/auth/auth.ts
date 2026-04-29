export const ROLE_HIERARCHY = ['VIEW_ONLY', 'DEVELOPER', 'TEAM_LEAD', 'ADMIN'] as const;

export type AppRole = (typeof ROLE_HIERARCHY)[number];

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
  roles: string[];
}

const AUTH_STORAGE_KEY = 'collabx.auth.session';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const base64 = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return atob(base64);
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const [, payload = ''] = token.split('.');
  if (!payload) {
    throw new Error('Invalid token payload');
  }
  const decoded = base64UrlDecode(payload);
  return JSON.parse(decoded) as Record<string, unknown>;
}

function parseRoles(payload: Record<string, unknown>): string[] {
  const rolesClaim = payload.roles;
  if (typeof rolesClaim !== 'string' || rolesClaim.trim().length === 0) {
    return [];
  }
  return rolesClaim
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

function parseEmail(payload: Record<string, unknown>): string {
  const subject = payload.sub;
  return typeof subject === 'string' ? subject : '';
}

export function hasMinimumRole(roles: string[], minimumRole: AppRole): boolean {
  const minimumLevel = ROLE_HIERARCHY.indexOf(minimumRole);
  if (minimumLevel < 0) {
    return false;
  }
  return roles.some((role) => ROLE_HIERARCHY.indexOf(role as AppRole) >= minimumLevel);
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Invalid email or password');
  }

  const payload = (await response.json()) as AuthResponse;
  const jwtPayload = parseJwtPayload(payload.accessToken);
  const expiresAtMs = Date.now() + payload.expiresInSeconds * 1000;

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
