import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ROUTES } from '../../app/routes';

function PublicOnlyRoute() {
  const { isAuthenticated, hasRoleAtLeast } = useAuth();

  if (isAuthenticated && hasRoleAtLeast('DEVELOPER')) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
