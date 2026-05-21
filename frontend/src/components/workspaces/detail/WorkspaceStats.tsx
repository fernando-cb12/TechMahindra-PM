import { Box, Paper, Typography, Avatar, LinearProgress, useTheme, alpha } from '@mui/material';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';

interface WorkspaceStatsProps {
  workspace: WorkspaceProjectCardData;
}

function WorkspaceStats({ workspace }: WorkspaceStatsProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'text.primary',
            }}
          >
            Current Progress
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
            }}
          >
            {workspace.currentProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={workspace.currentProgress}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'text.primary',
            }}
          >
            Estimated Progress
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
            }}
          >
            {workspace.estimatedProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={workspace.estimatedProgress}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': { bgcolor: alpha(theme.palette.primary.main, 0.6) },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              mb: 0.5,
            }}
          >
            Development Budget
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'text.primary',
            }}
          >
            {workspace.budgetLabel}
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              mb: 0.5,
            }}
          >
            Team Members ({workspace.members.length})
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {workspace.members.slice(0, 4).map((member, index) => {
              const initials = member
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase();
              return (
                <Avatar
                  key={`${workspace.id}-${member}-${index}`}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '12px',
                    fontWeight: 700,
                    bgcolor: 'primary.main',
                    color: theme.palette.mode === 'dark' ? '#F5F5F5' : undefined,
                  }}
                  title={member}
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
    </Paper>
  );
}

export default WorkspaceStats;
