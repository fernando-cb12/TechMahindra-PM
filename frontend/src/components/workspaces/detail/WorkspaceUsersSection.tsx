import { Box, Paper, Typography, Avatar, Chip, Button, useTheme, alpha } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';
import { useAuth } from '../../../auth/useAuth';

interface WorkspaceUsersSectionProps {
  workspace: WorkspaceProjectCardData;
}

interface TeamUser {
  name: string;
  avatarUrl?: string | null;
  roles: string[];
}

function WorkspaceUsersSection({ workspace }: WorkspaceUsersSectionProps) {
  const theme = useTheme();
  const { hasRoleAtLeast } = useAuth();
  const canManageWorkspaceActions = hasRoleAtLeast('TEAM_LEAD');

  const teamUsers: TeamUser[] = workspace.memberDetails && workspace.memberDetails.length > 0
    ? workspace.memberDetails.map((member) => ({
        name: member.name,
        avatarUrl: member.avatarUrl,
        roles: member.roles.length > 0 ? member.roles : [member.workspaceRole],
      }))
    : workspace.members.map((name) => ({
        name,
        avatarUrl: null,
        roles: ['Collaborator'],
      }));

  const roleColors: Record<string, string> = {
    Admin: theme.palette.error.main,
    'Team leader': theme.palette.warning.main,
    Developer: theme.palette.info.main,
    'View only': theme.palette.grey[700],
    Owner: theme.palette.success.main,
    Collaborator: theme.palette.primary.main,
    Viewer: theme.palette.grey[700],
  };

  const formatRoleLabel = (role: string) => {
    const normalized = role.trim().toUpperCase();
    switch (normalized) {
      case 'ADMIN':
        return 'Admin';
      case 'TEAM_LEAD':
        return 'Team leader';
      case 'DEVELOPER':
        return 'Developer';
      case 'VIEW_ONLY':
        return 'View only';
      case 'OWNER':
        return 'Owner';
      case 'COLLABORATOR':
        return 'Collaborator';
      case 'VIEWER':
        return 'Viewer';
      default:
        return role
          .toLowerCase()
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
    }
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
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: (currentTheme) =>
              currentTheme.palette.mode === 'dark'
                ? currentTheme.palette.text.primary
                : currentTheme.palette.primary.main,
          }}
        >
          Users
        </Typography>
        {canManageWorkspaceActions ? (
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
        ) : null}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
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
        {teamUsers.map((user, index) => {
          const initials = user.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase();

          return (
            <Box
              key={`${user.name}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '5px',
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
                src={user.avatarUrl ?? undefined}
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {user.roles.map((role) => {
                    const label = formatRoleLabel(role);
                    const roleColor = roleColors[label] || theme.palette.primary.main;

                    return (
                      <Chip
                        key={`${user.name}-${role}`}
                        size="small"
                        label={label}
                        sx={{
                          height: 18,
                          borderRadius: '5px',
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: alpha(roleColor, 0.15),
                          color: roleColor,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default WorkspaceUsersSection;
