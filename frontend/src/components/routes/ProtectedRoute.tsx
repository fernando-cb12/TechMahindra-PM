import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ROUTES } from '../../app/routes';
import type { AppRole } from '../../auth/auth';

interface ProtectedRouteProps {
  minimumRole?: AppRole;
}

function ProtectedRoute({ minimumRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, hasRoleAtLeast } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (minimumRole && !hasRoleAtLeast(minimumRole)) {
    return <Navigate to={ROUTES.login} replace state={{ denied: true }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
