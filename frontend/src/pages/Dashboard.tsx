import { Box, Typography } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import SummaryCards, { type SummaryCardData } from '../components/shared/SummaryCards';
import RecentProjectsSection, {
  type RecentProjectData,
} from '../components/dashboard/RecentProjectsSection';

function Dashboard() {
  const summaryItems: SummaryCardData[] = [
    { label: 'Active Projects', value: 12, color: 'primary' },
    { label: 'Open Issues', value: 47, color: 'primary' },
    { label: 'In Progress', value: 23, color: 'primary' },
  ];

  const recentProjects: RecentProjectData[] = [
    {
      title: 'Mobile App Redesign',
      description: 'Redesign of the mobile application for iOS and Android',
      members: ['A', 'LC', 'M'],
      extraMembers: 2,
      progress: 65,
      status: 'active',
    },
    {
      title: 'Backend API v2.0',
      description: 'Development of new API endpoints and database optimization',
      members: ['C', 'A', 'M'],
      progress: 42,
      status: 'in-progress',
    },
    {
      title: 'Security Audit',
      description: 'Complete security review and vulnerability assessment',
      members: ['A', 'LC'],
      progress: 15,
      status: 'planning',
    },
    {
      title: 'Documentation Update',
      description: 'Update technical documentation and user guides',
      members: ['C', 'M'],
      progress: 72,
      status: 'active',
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      <Sidebar activeNavItem="dashboard" />
      <Box sx={{ flex: 1, p: 3, backgroundColor: '#F5F5F5' }}>
        <Typography
          variant="h3"
          sx={{ mb: 2.5, color: 'primary.main', fontWeight: 700, fontSize: '32px', lineHeight: 1 }}
        >
          Dashboard
        </Typography>
        <SummaryCards items={summaryItems} />
        <RecentProjectsSection projects={recentProjects} />
      </Box>
    </Box>
  );
}

export default Dashboard;
