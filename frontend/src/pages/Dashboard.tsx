import { Box } from '@mui/material';
import { Sidebar } from '../components/layout';

function Dashboard() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeNavItem="dashboard" />
      <Box sx={{ flex: 1, p: 4, backgroundColor: '#f5f5f5' }}>
        {/* Dashboard content goes here */}
      </Box>
    </Box>
  );
}

export default Dashboard;
