import type { AppRole } from '../auth/auth';
import { apiClient } from './apiClient';

export type UserStatus = 'active' | 'inactive' | 'banned';

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  roles: AppRole[];
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  roles: AppRole[];
};

export type UpdateUserPayload = {
  name?: string;
  status?: UserStatus;
  roles?: AppRole[];
};

type UserDtoApi = {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  roles: string[] | Record<string, string>;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string; fields?: Record<string, string> } } })
      .response?.data;
    if (data?.error) return data.error;
    if (data?.fields && typeof data.fields === 'object') {
      const first = Object.values(data.fields)[0];
      if (first) return first;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

function parseRoles(raw: UserDtoApi['roles']): AppRole[] {
  const values = Array.isArray(raw) ? raw : Object.values(raw ?? {});
  return values
    .map((role) => String(role).trim() as AppRole)
    .filter(
      (role): role is AppRole =>
        role === 'ADMIN' || role === 'TEAM_LEAD' || role === 'DEVELOPER' || role === 'VIEW_ONLY',
    );
}

function mapUser(raw: UserDtoApi): ManagedUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    status: raw.status,
    createdAt: raw.createdAt,
    roles: parseRoles(raw.roles),
  };
}

export async function listManagedUsers(params?: {
  name?: string;
  status?: UserStatus;
}): Promise<ManagedUser[]> {
  try {
    const { data } = await apiClient.get<UserDtoApi[]>('/api/users', { params });
    return data.map(mapUser);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createManagedUser(payload: CreateUserPayload): Promise<ManagedUser> {
  try {
    const { data } = await apiClient.post<UserDtoApi>('/api/users', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      status: payload.status,
      roles: payload.roles,
    });
    return mapUser(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function updateManagedUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<ManagedUser> {
  try {
    const { data } = await apiClient.put<UserDtoApi>(`/api/users/${id}`, payload);
    return mapUser(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function deleteManagedUser(id: number): Promise<void> {
  try {
    await apiClient.delete(`/api/users/${id}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export function formatUserRole(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    VIEW_ONLY: 'View only',
    DEVELOPER: 'Developer',
    TEAM_LEAD: 'Team leader',
    ADMIN: 'Admin',
  };
  return labels[role] ?? role;
}

export function formatUserStatus(status: UserStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
