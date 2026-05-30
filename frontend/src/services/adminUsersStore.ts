import type { AppRole } from '../auth/auth';
import { ADMIN_USERS_MOCK, type ManagedUser, type UserStatus } from '../data/adminUsersMock';

export type { ManagedUser, UserStatus };

export type CreateUserPayload = {
  name: string;
  email: string;
  status: UserStatus;
  roles: AppRole[];
};

export type UpdateUserPayload = {
  name?: string;
  status?: UserStatus;
  roles?: AppRole[];
};

let users: ManagedUser[] = ADMIN_USERS_MOCK.map((user) => ({ ...user, roles: [...user.roles] }));
let nextId = Math.max(0, ...users.map((user) => user.id)) + 1;

function cloneUsers(): ManagedUser[] {
  return users.map((user) => ({ ...user, roles: [...user.roles] }));
}

export function listUsers(params?: {
  name?: string;
  status?: UserStatus;
}): ManagedUser[] {
  let result = cloneUsers();
  const query = params?.name?.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    );
  }
  if (params?.status) {
    result = result.filter((user) => user.status === params.status);
  }
  return result;
}

export function createUser(payload: CreateUserPayload): ManagedUser {
  const emailTaken = users.some(
    (user) => user.email.toLowerCase() === payload.email.trim().toLowerCase(),
  );
  if (emailTaken) {
    throw new Error('A user with this email already exists.');
  }

  const created: ManagedUser = {
    id: nextId++,
    name: payload.name.trim(),
    email: payload.email.trim(),
    status: payload.status,
    roles: [...payload.roles],
    createdAt: new Date().toISOString(),
  };
  users = [created, ...users];
  return { ...created, roles: [...created.roles] };
}

export function updateUser(id: number, payload: UpdateUserPayload): ManagedUser {
  const index = users.findIndex((user) => user.id === id);
  if (index < 0) {
    throw new Error('User not found');
  }

  const current = users[index];
  const updated: ManagedUser = {
    ...current,
    name: payload.name?.trim() ?? current.name,
    status: payload.status ?? current.status,
    roles: payload.roles ? [...payload.roles] : [...current.roles],
  };
  users = [...users.slice(0, index), updated, ...users.slice(index + 1)];
  return { ...updated, roles: [...updated.roles] };
}

export function deleteUser(id: number): void {
  const exists = users.some((user) => user.id === id);
  if (!exists) {
    throw new Error('User not found');
  }
  users = users.filter((user) => user.id !== id);
}

export function resetUsersStore(): void {
  users = ADMIN_USERS_MOCK.map((user) => ({ ...user, roles: [...user.roles] }));
  nextId = Math.max(0, ...users.map((user) => user.id)) + 1;
}
