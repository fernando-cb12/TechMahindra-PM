import { Box, Paper, Typography, Avatar, Chip, LinearProgress, useTheme, alpha } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';

interface WorkspaceGeneralInfoProps {
  workspace: WorkspaceProjectCardData;
}

function WorkspaceGeneralInfo({ workspace }: WorkspaceGeneralInfoProps) {
  const theme = useTheme();

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    planning: { label: 'Planning', bg: theme.palette.grey[400], color: theme.palette.common.white },
    'in-progress': { label: 'In Progress', bg: theme.palette.warning.main, color: theme.palette.grey[900] },
    'on-hold': { label: 'On Hold', bg: theme.palette.grey[700], color: theme.palette.common.white },
    completed: { label: 'Completed', bg: theme.palette.success.main, color: theme.palette.common.white },
  };

  const status = statusConfig[workspace.status] || statusConfig.planning;

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

  const projectDueDate = parseProjectDate(workspace.dueDate);
  const dueDateLabel = projectDueDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(projectDueDate)
    : workspace.dueDate;

  const visibleMembers = workspace.memberDetails && workspace.memberDetails.length > 0
    ? workspace.memberDetails.slice(0, 4)
    : workspace.members.slice(0, 4).map((member) => ({ name: member, avatarUrl: null }));

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 120,
          background:
            workspace.imageUrl ??
            'linear-gradient(135deg, rgba(95,2,41,0.95) 0%, rgba(163,51,77,0.95) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {workspace.imageUrl ? (
          <Box
            component="img"
            src={workspace.imageUrl}
            alt={workspace.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: (currentTheme) =>
                  currentTheme.palette.mode === 'dark'
                    ? currentTheme.palette.text.primary
                    : currentTheme.palette.primary.main,
                mb: 0.5,
              }}
            >
              {workspace.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
              {workspace.description}
            </Typography>
          </Box>
          <Chip
            label={status.label}
            sx={{
              height: 24,
              borderRadius: '5px',
              bgcolor: status.bg,
              color: status.color,
              fontWeight: 700,
              fontSize: 12,
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 600 }}>
            Due: {dueDateLabel}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Current Progress</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main' }}>
              {workspace.currentProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={workspace.currentProgress}
            sx={{
              height: 8,
              borderRadius: '5px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Estimated Progress</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main' }}>
              {workspace.estimatedProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={workspace.estimatedProgress}
            sx={{
              height: 8,
              borderRadius: '5px',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': { bgcolor: alpha(theme.palette.primary.main, 0.6) },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
              Development Budget
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{workspace.budgetLabel}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
              Team Members ({workspace.members.length})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {visibleMembers.map((member, index) => {
                const initials = member.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase();
                return (
                  <Avatar
                    key={`${workspace.id}-${member.name}-${index}`}
                    src={member.avatarUrl ?? undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '12px',
                      fontWeight: 700,
                      bgcolor: 'primary.main',
                      color: theme.palette.mode === 'dark' ? '#F5F5F5' : undefined,
                    }}
                    title={member.name}
                  >
                    {initials}
                  </Avatar>
                );
              })}
              {workspace.members.length > 4 && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '12px',
                    fontWeight: 700,
                    bgcolor: 'grey.500',
                    color: '#fff',
                  }}
                  title={`+${workspace.members.length - 4} more`}
                >
                  +{workspace.members.length - 4}
                </Avatar>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default WorkspaceGeneralInfo;
