import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isDevAdminPreviewSession } from '../../auth/auth';
import { ROUTES } from '../../app/routes';

/** Admin UI is only available via the temporary login preview entry point. */
function AdminRoute() {
  const location = useLocation();
  const { session } = useAuth();

  if (!isDevAdminPreviewSession(session)) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default AdminRoute;
