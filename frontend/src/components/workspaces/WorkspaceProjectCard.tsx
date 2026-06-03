import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Avatar, Box, Chip, LinearProgress, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export type WorkspaceProjectStatus = 'in-progress' | 'planning' | 'active' | 'completed';

export interface WorkspaceProjectCardData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  members: string[];
  memberDetails?: WorkspaceMemberData[];
  currentProgress: number;
  estimatedProgress: number;
  dueDate: string;
  budgetLabel: string;
  status: WorkspaceProjectStatus;
}

export interface WorkspaceMemberData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roles: string[];
  workspaceRole: string;
}

interface WorkspaceProjectCardProps {
  project: WorkspaceProjectCardData;
  onSelect?: (projectId: string) => void;
}

function WorkspaceProjectCard({ project, onSelect }: WorkspaceProjectCardProps) {
  const theme = useTheme();
  const statusConfig: Record<WorkspaceProjectStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Active', bg: theme.palette.grey[800], color: theme.palette.common.white },
    'in-progress': {
      label: 'In Progress',
      bg: theme.palette.warning.main,
      color: theme.palette.grey[900],
    },
    planning: { label: 'Planning', bg: theme.palette.grey[400], color: theme.palette.common.white },
    completed: { label: 'Completed', bg: theme.palette.success.main, color: theme.palette.common.white },
  };
  const status = statusConfig[project.status];

  const parseProjectDate = (value: string): Date | null => {
    const mmddyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const mmddMatch = mmddyyyy.exec(value);
    if (mmddMatch) {
      const [, month, day, year] = mmddMatch;
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
      return new Date(`${value}T00:00:00`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const projectDueDate = parseProjectDate(project.dueDate);
  const dueDateLabel = projectDueDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(projectDueDate)
    : project.dueDate;

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect?.(project.id)}
      sx={{
        width: '100%',
        maxWidth: 300,
        minHeight: 330,
        borderRadius: '5px',
        bgcolor: 'background.paper',
        px: 2,
        py: 2.5,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onSelect ? {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        } : {},
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 78,
          borderRadius: '5px',
          overflow: 'hidden',
          background:
            project.imageUrl ??
            'linear-gradient(135deg, rgba(95,2,41,0.95) 0%, rgba(163,51,77,0.95) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 1.5,
        }}
      >
        {project.imageUrl ? (
          <Box
            component="img"
            src={project.imageUrl}
            alt={`${project.title} workspace`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography
          sx={{
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
            fontSize: '10.5px',
            fontWeight: 700,
            py: 1,
          }}
        >
          {project.title}
        </Typography>
        <Chip
          label={status.label}
          size="small"
          sx={{
            height: 16,
            borderRadius: '2px',
            bgcolor: status.bg,
            color: status.color,
            fontSize: '7px',
            fontWeight: 700,
            '& .MuiChip-label': { px: 0.8 },
            marginTop: 1,
          }}
        />
      </Box>

      <Typography sx={{ mt: 0.5, color: 'text.primary', fontSize: '8px', minHeight: 28, lineHeight: 1.35 }}>
        {project.description}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.25 }}>
        {(project.memberDetails && project.memberDetails.length > 0
          ? project.memberDetails
          : project.members.map((member) => ({ name: member, avatarUrl: null }))).map((member, index) => {
          const initials = member.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase();
          return (
            <Avatar
              key={`${project.id}-${member.name}-${index}`}
              src={member.avatarUrl ?? undefined}
              sx={{
                width: 18,
                height: 18,
                fontSize: '9px',
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#F5F5F5' : undefined,
                border: (theme) =>
                  `1px solid ${
                    theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : theme.palette.common.white
                  }`,
                ml: index === 0 ? 0 : -0.45,
              }}
            >
              {initials}
            </Avatar>
          );
        })}
      </Box>

      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={project.currentProgress}
          sx={{
            height: 5,
            borderRadius: '2px',
            bgcolor: 'grey.300',
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
          }}
        />
        <Typography sx={{ mt: 0.5, color: 'text.primary', fontSize: '8px' }}>
          {project.currentProgress}% Current Progress
        </Typography>
      </Box>

      <Box sx={{ mt: 0.6, borderTop: (t) => `1px solid ${alpha(t.palette.primary.main, 0.5)}`, pt: 0.7 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 9, color: 'primary.main' }} />
          <Typography sx={{ color: 'text.primary', fontSize: '8px' }}>Due: {dueDateLabel}</Typography>
        </Box>
        <Typography sx={{ mt: 0.7, color: 'text.primary', fontSize: '8px' }}>
          Development Budget: {project.budgetLabel}
        </Typography>
      </Box>

      <Box sx={{ mt: 0.9 }}>
        <LinearProgress
          variant="determinate"
          value={project.estimatedProgress}
          sx={{
            height: 5,
            borderRadius: '2px',
            bgcolor: 'grey.300',
            '& .MuiLinearProgress-bar': { bgcolor: (t) => alpha(t.palette.primary.main, 0.58) },
          }}
        />
        <Typography sx={{ mt: 0.5, color: 'text.primary', fontSize: '8px' }}>
          {project.estimatedProgress}% Estimated Progress
        </Typography>
      </Box>
    </Paper>
  );
}

export default WorkspaceProjectCard;
