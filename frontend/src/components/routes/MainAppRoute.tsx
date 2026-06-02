import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { canAccessMainApp, isAdminOnly } from '../../auth/auth';
import { ROUTES } from '../../app/routes';

function MainAppRoute() {
  const location = useLocation();
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated || !session) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (isAdminOnly(session.roles)) {
    return <Navigate to={ROUTES.admin} replace />;
  }

  if (!canAccessMainApp(session.roles)) {
    return <Navigate to={ROUTES.login} replace state={{ denied: true }} />;
  }

  return <Outlet />;
}

export default MainAppRoute;
