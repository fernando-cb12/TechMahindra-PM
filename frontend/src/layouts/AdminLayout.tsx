import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { useAuth } from '../auth/useAuth';
import { ROUTES } from '../app/routes';

function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar onLogout={handleLogout} />
      <Box
        component="main"
        sx={{ flex: 1, ml: '220px', minHeight: '100vh', overflowX: 'hidden' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
