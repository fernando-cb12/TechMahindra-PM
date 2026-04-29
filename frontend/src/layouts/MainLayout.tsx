import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import { pathToActiveNavItem } from '../app/routes';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../app/routes';

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const activeNavItem = pathToActiveNavItem(location.pathname);

  // Check if we are inside a workspace board to highlight the sidebar correctly
  const boardMatch = location.pathname.match(/\/workspaces\/([^\/]+)\/boards\/([^\/]+)/);
  const activeProject = boardMatch ? boardMatch[1] : undefined;
  const activeSubsection = boardMatch ? boardMatch[2] : undefined;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        activeNavItem={activeNavItem}
        activeProject={activeProject}
        activeSubsection={activeSubsection}
        onSubsectionClick={(projectId, subId) => {
          navigate(`/workspaces/${projectId}/boards/${subId}`);
        }}
        onLogout={handleLogout}
      />
      <Outlet />
    </Box>
  );
}

export default MainLayout;
