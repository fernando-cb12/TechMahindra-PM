import { Box } from '@mui/material';
import { DashboardProvider } from './DashboardContext';
import DashboardHeader from './DashboardHeader';
import DashboardGrid from './DashboardGrid';
import AddMetricModal from './AddMetricModal';

function MetricDashboard() {
  return (
    <DashboardProvider>
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          px: { xs: 2, sm: 4 },
          py: 3,
        }}
      >
        <DashboardHeader />
        <DashboardGrid />
        <AddMetricModal />
      </Box>
    </DashboardProvider>
  );
}

export default MetricDashboard;
