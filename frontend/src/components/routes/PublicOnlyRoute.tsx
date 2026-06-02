import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { canAccessMainApp, isAdminOnly } from '../../auth/auth';
import { ROUTES } from '../../app/routes';

function PublicOnlyRoute() {
  const { isAuthenticated, session } = useAuth();

  if (isAuthenticated && session) {
    if (isAdminOnly(session.roles)) {
      return <Navigate to={ROUTES.admin} replace />;
    }
    if (canAccessMainApp(session.roles)) {
      return <Navigate to={ROUTES.dashboard} replace />;
    }
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
