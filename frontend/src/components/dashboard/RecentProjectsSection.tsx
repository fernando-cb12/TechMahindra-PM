import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import { Avatar, Box, Button, Chip, LinearProgress, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { WorkspaceProjectStatus } from '../workspaces/WorkspaceProjectCard';

export interface RecentProjectData {
  id: string;
  title: string;
  description: string;
  members: string[];
  dueDate: string;
  currentProgress: number;
  estimatedProgress: number;
  status: WorkspaceProjectStatus;
}

interface RecentProjectsSectionProps {
  projects: RecentProjectData[];
  delayedCount: number;
  onOpenWorkspace: (workspaceId: string) => void;
  onOpenAll: () => void;
}

function formatDueDate(value: string) {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function RecentProjectCard({
  project,
  onOpen,
}: {
  project: RecentProjectData;
  onOpen: (workspaceId: string) => void;
}) {
  const theme = useTheme();
  const statusConfig: Record<WorkspaceProjectStatus, { label: string; bg: string; color: string }> = {
    planning: { label: 'Planning', bg: theme.palette.grey[500], color: theme.palette.common.white },
    'in-progress': { label: 'In Progress', bg: theme.palette.warning.main, color: theme.palette.grey[900] },
    'on-hold': { label: 'On Hold', bg: theme.palette.grey[700], color: theme.palette.common.white },
    completed: { label: 'Completed', bg: theme.palette.success.main, color: theme.palette.common.white },
  };
  const status = statusConfig[project.status];
  const progressGap = project.currentProgress - project.estimatedProgress;
  const isBehind = project.status !== 'completed' && progressGap < 0;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '5px',
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
        px: 2,
        py: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.primary', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
            {project.title}
          </Typography>
          <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 13.5, lineHeight: 1.45 }}>
            {project.description}
          </Typography>
        </Box>
        <Chip
          label={status.label}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 800,
            borderRadius: '5px',
            bgcolor: status.bg,
            color: status.color,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 1.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'text.secondary' }}>
          <GroupOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
            {project.members.length} member{project.members.length === 1 ? '' : 's'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'text.secondary' }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
            Due {formatDueDate(project.dueDate)}
          </Typography>
        </Box>
        {isBehind ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'error.main' }}>
            <TrendingDownRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
              {Math.abs(progressGap)}% behind plan
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.85 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
            Delivery progress
          </Typography>
          <Typography sx={{ color: 'text.primary', fontSize: 12, fontWeight: 800 }}>
            {project.currentProgress}% / {project.estimatedProgress}% plan
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(project.currentProgress, 100)}
          sx={{
            height: 8,
            borderRadius: 999,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              bgcolor: isBehind ? 'warning.main' : 'primary.main',
            },
          }}
        />
      </Box>

      <Box sx={{ mt: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {project.members.slice(0, 4).map((member, index) => (
            <Avatar
              key={`${project.id}-${member}-${index}`}
              sx={{
                width: 28,
                height: 28,
                ml: index === 0 ? 0 : -0.75,
                border: (t) => `2px solid ${t.palette.background.paper}`,
                bgcolor: 'primary.main',
                color: 'common.white',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {member
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
          ))}
        </Box>
        <Button
          onClick={() => onOpen(project.id)}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
            borderRadius: '5px',
          }}
        >
          Open
        </Button>
      </Box>
    </Paper>
  );
}

function RecentProjectsSection({
  projects,
  delayedCount,
  onOpenWorkspace,
  onOpenAll,
}: RecentProjectsSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '5px',
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: 'background.paper',
        p: 2.25,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: 20, fontWeight: 900 }}>
            Workspace Portfolio
          </Typography>
          <Typography sx={{ mt: 0.6, color: 'text.secondary', fontSize: 13.5 }}>
            {delayedCount > 0
              ? `${delayedCount} workspace${delayedCount === 1 ? '' : 's'} running behind plan.`
              : 'Workspaces are currently on track.'}
          </Typography>
        </Box>
        <Button
          onClick={onOpenAll}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '5px',
            color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
          }}
        >
          View all
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {projects.length > 0 ? (
          projects.map((project) => (
            <RecentProjectCard key={project.id} project={project} onOpen={onOpenWorkspace} />
          ))
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No workspaces available yet.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default RecentProjectsSection;
