export const ROUTES = {
  login: '/login',
  admin: '/admin',
  adminSettings: '/admin/settings',
  dashboard: '/dashboard',
  workspaces: '/workspaces',
  workspaceDetail: '/workspaces/:workspaceId',
  workspaceIssues: '/workspaces/:workspaceId/issues',
  workspaceBoard: '/workspaces/:workspaceId/boards/:boardId',
  issues: '/issues',
  metrics: '/metrics',
  settings: '/settings',
  career: '/career',
  rewards: '/rewards',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Maps sidebar `NavItem.value` to URL paths. */
export const NAV_ITEM_TO_PATH: Record<string, RoutePath> = {
  dashboard: ROUTES.dashboard,
  workspaces: ROUTES.workspaces,
  issues: ROUTES.issues,
  metrics: ROUTES.metrics,
  settings: ROUTES.settings,
  career: '/career',
  rewards: '/rewards',
};

export function pathToActiveNavItem(pathname: string): string {
  const match = Object.entries(NAV_ITEM_TO_PATH).find(
    ([, path]) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.[0] ?? 'dashboard';
}
