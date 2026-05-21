import { Box, Paper, Typography, Avatar, Chip, Button, useTheme, alpha } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';

interface WorkspaceUsersSectionProps {
  workspace: WorkspaceProjectCardData;
}

interface TeamUser {
  name: string;
  role: string;
  color?: string;
}

function WorkspaceUsersSection({ workspace }: WorkspaceUsersSectionProps) {
  const theme = useTheme();

  // Convert workspace members to team users with roles
  const teamUsers: TeamUser[] = workspace.members.map((name, index) => {
    const roles = ['Team Lead', 'Developer', 'Developer', 'Developer'];
    return {
      name,
      role: roles[index % roles.length] || 'Developer',
    };
  });

  const roleColors: Record<string, string> = {
    'Team Lead': theme.palette.error.main,
    'Developer': theme.palette.info.main,
    'Designer': theme.palette.warning.main,
    'Manager': theme.palette.success.main,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
          }}
        >
          Users
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          sx={{
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          Add
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {teamUsers.map((user, index) => {
          const initials = user.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase();
          const roleColor = roleColors[user.role] || theme.palette.primary.main;

          return (
            <Box
              key={`${user.name}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: '12px',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: theme.palette.mode === 'dark' ? '#F5F5F5' : undefined,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </Typography>
                <Chip
                  size="small"
                  label={user.role}
                  sx={{
                    height: 18,
                    mt: 0.25,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: alpha(roleColor, 0.15),
                    color: roleColor,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default WorkspaceUsersSection;
