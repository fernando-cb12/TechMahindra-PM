import type { AppRole } from '../auth/auth';

export type UserStatus = 'active' | 'inactive' | 'banned';

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  roles: AppRole[];
};

export const ADMIN_USERS_MOCK: ManagedUser[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'admin1@gmail.com',
    status: 'active',
    createdAt: '2025-01-12T10:00:00Z',
    roles: ['ADMIN'],
  },
  {
    id: 2,
    name: 'Marcus Webb',
    email: 'lead1@gmail.com',
    status: 'active',
    createdAt: '2025-02-03T14:30:00Z',
    roles: ['TEAM_LEAD'],
  },
  {
    id: 3,
    name: 'Priya Nair',
    email: 'developer1@gmail.com',
    status: 'active',
    createdAt: '2025-02-18T09:15:00Z',
    roles: ['DEVELOPER'],
  },
  {
    id: 4,
    name: 'Diego Ramos',
    email: 'developer2@gmail.com',
    status: 'active',
    createdAt: '2025-03-01T16:45:00Z',
    roles: ['DEVELOPER'],
  },
  {
    id: 5,
    name: 'Jordan Ellis',
    email: 'alumni1@gmail.com',
    status: 'inactive',
    createdAt: '2024-11-20T11:00:00Z',
    roles: ['VIEW_ONLY'],
  },
];

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
