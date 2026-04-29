import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import { pathToActiveNavItem } from '../app/routes';

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeNavItem = pathToActiveNavItem(location.pathname);

  // Check if we are inside a workspace board to highlight the sidebar correctly
  const boardMatch = location.pathname.match(/\/workspaces\/([^\/]+)\/boards\/([^\/]+)/);
  const activeProject = boardMatch ? boardMatch[1] : undefined;
  const activeSubsection = boardMatch ? boardMatch[2] : undefined;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        activeNavItem={activeNavItem}
        activeProject={activeProject}
        activeSubsection={activeSubsection}
        onSubsectionClick={(projectId, subId) => {
          navigate(`/workspaces/${projectId}/boards/${subId}`);
        }}
      />
      <Outlet />
    </Box>
  );
}

export default MainLayout;
