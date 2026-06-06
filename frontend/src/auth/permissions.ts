import { hasMinimumRole, type AppRole } from './auth';

export function canManageWorkspaces(roles: AppRole[]): boolean {
  return hasMinimumRole(roles, 'TEAM_LEAD');
}

export function canAccessMetrics(roles: AppRole[]): boolean {
  return hasMinimumRole(roles, 'TEAM_LEAD');
}

export function canEditSettings(roles: AppRole[]): boolean {
  return hasMinimumRole(roles, 'TEAM_LEAD');
}
