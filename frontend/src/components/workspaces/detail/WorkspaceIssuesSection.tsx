import { Box, Paper, Typography, Chip, Avatar, Button, useTheme, alpha } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';

interface WorkspaceIssuesSectionProps {
  workspace: WorkspaceProjectCardData;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'closed' | 'on-hold';
}

function WorkspaceIssuesSection({ workspace }: WorkspaceIssuesSectionProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  // Mock data - replace with actual API call
  const issues: Issue[] = [
    {
      id: 'ISSUE-001',
      title: 'Audit session management',
      description: 'Implement comprehensive audit for session creation...',
      assignee: workspace.members[0] || 'Unassigned',
      priority: 'high',
      status: 'in-progress',
    },
    {
      id: 'ISSUE-002',
      title: 'Implement user registration system',
      description: 'Create new user registration with email verification...',
      assignee: workspace.members[1] || 'Unassigned',
      priority: 'high',
      status: 'in-progress',
    },
    {
      id: 'ISSUE-003',
      title: 'Redesign navigation structure',
      description: 'Improve navigation UI for better user experience...',
      assignee: workspace.members[2] || 'Unassigned',
      priority: 'medium',
      status: 'on-hold',
    },
    {
      id: 'ISSUE-004',
      title: 'Setup navigation structure',
      description: 'Configure navigation routes and structure...',
      assignee: workspace.members[0] || 'Unassigned',
      priority: 'medium',
      status: 'closed',
    },
  ];

  const priorityConfig: Record<Issue['priority'], { bg: string; color: string; label: string }> = {
    critical: {
      bg: theme.palette.error.main,
      color: '#fff',
      label: 'Critical',
    },
    high: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
      label: 'High',
    },
    medium: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
      label: 'Medium',
    },
    low: {
      bg: theme.palette.info.light,
      color: theme.palette.info.dark,
      label: 'Low',
    },
  };

  const statusConfig: Record<Issue['status'], { bg: string; color: string; label: string }> = {
    open: {
      bg: alpha(theme.palette.info.main, 0.1),
      color: theme.palette.info.main,
      label: 'Open',
    },
    'in-progress': {
      bg: alpha(theme.palette.warning.main, 0.1),
      color: theme.palette.warning.main,
      label: 'In Progress',
    },
    closed: {
      bg: alpha(theme.palette.success.main, 0.1),
      color: theme.palette.success.main,
      label: 'Closed',
    },
    'on-hold': {
      bg: alpha(theme.palette.grey[500], 0.1),
      color: theme.palette.grey[700],
      label: 'On Hold',
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        p: 3,
        minHeight: 340,
        maxHeight: 460,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          onClick={() =>
            navigate(
              `/issues?workspaceId=${encodeURIComponent(workspace.id)}&project=${encodeURIComponent(
                workspace.title,
              )}`,
            )
          }
          sx={{
            textTransform: 'none',
            p: 0,
            minWidth: 0,
            fontWeight: 700,
            fontSize: 20,
            color: (t) => (t.palette.mode === 'dark' ? t.palette.text.primary : t.palette.primary.main),
            '&:hover': { bgcolor: 'transparent' },
            justifyContent: 'flex-start',
          }}
        >
          Issues
        </Button>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 600 }}>
          + Create Issue
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            width: 8,
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.grey[300], 0.35),
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: '5px',
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[600], 0.75) : alpha(theme.palette.grey[500], 0.75),
          },
        }}
      >
        {issues.map((issue) => {
          const priority = priorityConfig[issue.priority];
          const status = statusConfig[issue.status];
          const initials = issue.assignee
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase();

          return (
            <Box
              key={issue.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: '5px',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: theme.palette.primary.main,
                  cursor: 'pointer',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '11px',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: theme.palette.mode === 'dark' ? '#F5F5F5' : undefined,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {issue.title}
                  </Typography>
                  <Button
                    size="small"
                    sx={{ minWidth: 32, p: 0, color: 'text.secondary', ml: 1 }}
                  >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 0.75,
                  }}
                >
                  {issue.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={issue.id}
                    sx={{
                      height: 20,
                      borderRadius: '5px',
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  />
                  <Chip
                    size="small"
                    label={priority.label}
                    sx={{
                      height: 20,
                      borderRadius: '5px',
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: priority.bg,
                      color: priority.color,
                    }}
                  />
                  <Chip
                    size="small"
                    label={status.label}
                    sx={{
                      height: 20,
                      borderRadius: '5px',
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: status.bg,
                      color: status.color,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default WorkspaceIssuesSection;
