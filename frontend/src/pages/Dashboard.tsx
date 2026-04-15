import { Box, Typography } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import SummaryCards, { type SummaryCardData } from '../components/shared/SummaryCards';

function Dashboard() {
  const summaryItems: SummaryCardData[] = [
    { label: 'Active Projects', value: 12, color: 'primary' },
    { label: 'Open Issues', value: 47, color: 'primary' },
    { label: 'In Progress', value: 23, color: 'primary' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      <Sidebar activeNavItem="dashboard" />
      <Box sx={{ flex: 1, p: 4, backgroundColor: '#F5F5F5' }}>
        <Typography variant="h3" sx={{ mb: 5, color: 'primary.main', fontWeight: 700 }}>
          Dashboard
        </Typography>
        <SummaryCards items={summaryItems} />
      </Box>
    </Box>
  );
}

export default Dashboard;
