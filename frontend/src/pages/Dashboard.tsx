import { Box, Typography } from '@mui/material';
import SummaryCards, { type SummaryCardData } from '../components/dashboard/SummaryCards';
import RecentProjectsSection, {
  type RecentProjectData,
} from '../components/dashboard/RecentProjectsSection';
import RecentIssuesSection, {
  type RecentIssueData,
} from '../components/dashboard/RecentIssuesSection';

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

  const recentIssues: RecentIssueData[] = [
    {
      key: 'PROJ-123',
      summary: 'Fix login validation error',
      assignee: 'Luis Carlos',
      priority: 'high',
      status: 'in-progress',
    },
    {
      key: 'PROJ-121',
      summary: 'Add dark mode theme',
      assignee: 'Marco',
      priority: 'medium',
      status: 'to-do',
    },
    {
      key: 'PROJ-124',
      summary: 'Optimize database queries',
      assignee: 'Camou',
      priority: 'high',
      status: 'in-progress',
    },
    {
      key: 'PROJ-122',
      summary: 'Create User manual',
      assignee: 'Antonio',
      priority: 'low',
      status: 'done',
    },
    {
      key: 'PROJ-126',
      summary: 'Security patch deployment',
      assignee: 'Luis Carlos',
      priority: 'high',
      status: 'done',
    },
    {
      key: 'PROJ-125',
      summary: 'Add dark mode theme',
      assignee: 'Marco',
      priority: 'medium',
      status: 'to-do',
    },
  ];

  return (
    <Box sx={{ flex: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography
        variant="h3"
        sx={{
          mb: 2.5,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.primary.main,
          fontWeight: 700,
          fontSize: '32px',
          lineHeight: 1,
        }}
      >
        Dashboard
      </Typography>
      <SummaryCards items={summaryItems} />
      <RecentProjectsSection projects={recentProjects} />
      <RecentIssuesSection issues={recentIssues} />
    </Box>
  );
}

export default Dashboard;
