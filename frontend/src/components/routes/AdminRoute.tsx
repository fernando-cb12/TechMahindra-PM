import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ROUTES } from '../../app/routes';

function AdminRoute() {
  const location = useLocation();
  const { isAuthenticated, hasRoleAtLeast } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (!hasRoleAtLeast('ADMIN')) {
    return <Navigate to={ROUTES.login} replace state={{ denied: true }} />;
  }

  return <Outlet />;
}

export default AdminRoute;
