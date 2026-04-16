import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import { pathToActiveNavItem } from '../app/routes';

function MainLayout() {
  const location = useLocation();
  const activeNavItem = pathToActiveNavItem(location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeNavItem={activeNavItem} />
      <Outlet />
    </Box>
  );
}

export default MainLayout;
