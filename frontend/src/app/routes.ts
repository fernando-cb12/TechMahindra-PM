export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  workspaces: '/workspaces',
  issues: '/issues',
  metrics: '/metrics',
  settings: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Maps sidebar `NavItem.value` to URL paths. */
export const NAV_ITEM_TO_PATH: Record<string, RoutePath> = {
  dashboard: ROUTES.dashboard,
  workspaces: ROUTES.workspaces,
  issues: ROUTES.issues,
  metrics: ROUTES.metrics,
  settings: ROUTES.settings,
};

export function pathToActiveNavItem(pathname: string): string {
  const match = Object.entries(NAV_ITEM_TO_PATH).find(
    ([, path]) => pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.[0] ?? 'dashboard';
}
