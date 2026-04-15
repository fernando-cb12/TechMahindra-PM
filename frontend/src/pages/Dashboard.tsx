import { Box } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';

type DashboardProps = {
  onNavItemClick?: (value: string) => void;
};

function Dashboard({ onNavItemClick }: DashboardProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeNavItem="dashboard" onNavItemClick={onNavItemClick} />
      <Box sx={{ flex: 1, p: 4, backgroundColor: '#f5f5f5' }}>
        {/* Dashboard content goes here */}
      </Box>
    </Box>
  );
}

export default Dashboard;
