import { useMemo, useState, type MouseEvent } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Select,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { WorkspaceProjectCardData } from '../WorkspaceProjectCard';
import { useAuth } from '../../../auth/useAuth';
import {
  addWorkspaceMembers,
  getAssignableWorkspaceUsers,
  removeWorkspaceMember,
  type AssignableUser,
} from '../../../services/workspacesService';
import { showAppError, showAppNotification } from '../../shared/appNotifications';
import WorkspaceActionPillButton from './WorkspaceActionPillButton';

interface WorkspaceUsersSectionProps {
  workspace: WorkspaceProjectCardData;
  onWorkspaceChange?: (workspace: WorkspaceProjectCardData) => void;
}

interface TeamUser {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  roles: string[];
}

function WorkspaceUsersSection({ workspace, onWorkspaceChange }: WorkspaceUsersSectionProps) {
  const theme = useTheme();
  const { session, hasRoleAtLeast } = useAuth();
  const canManageWorkspaceActions = hasRoleAtLeast('TEAM_LEAD');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isLoadingAssignableUsers, setIsLoadingAssignableUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const [memberMenu, setMemberMenu] = useState<{ anchor: HTMLElement; user: TeamUser } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamUser | null>(null);

  const teamUsers: TeamUser[] = workspace.memberDetails && workspace.memberDetails.length > 0
    ? workspace.memberDetails.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        roles: member.roles.length > 0 ? member.roles : [member.workspaceRole],
      }))
    : workspace.members.map((name) => ({
        name,
        avatarUrl: null,
        roles: ['Collaborator'],
      }));

  const workspaceUserIds = useMemo(
    () => new Set((workspace.memberDetails ?? []).map((member) => Number(member.id))),
    [workspace.memberDetails]
  );
  const availableUsers = useMemo(
    () => assignableUsers.filter((user) => !workspaceUserIds.has(user.id)),
    [assignableUsers, workspaceUserIds]
  );

  const openAddDialog = () => {
    setIsAddOpen(true);
    setSelectedUserIds([]);
    if (assignableUsers.length > 0 || isLoadingAssignableUsers) return;
    setIsLoadingAssignableUsers(true);
    void getAssignableWorkspaceUsers()
      .then(setAssignableUsers)
      .catch((error) => showAppError(error, 'Failed to load users'))
      .finally(() => setIsLoadingAssignableUsers(false));
  };

  const closeAddDialog = () => {
    if (isSavingMembers) return;
    setIsAddOpen(false);
    setSelectedUserIds([]);
  };

  const submitAddUsers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsSavingMembers(true);
    try {
      const updatedWorkspace = await addWorkspaceMembers(workspace.id, selectedUserIds);
      onWorkspaceChange?.(updatedWorkspace);
      setIsAddOpen(false);
      setSelectedUserIds([]);
      showAppNotification({
        message: selectedUserIds.length === 1 ? 'User added to workspace' : 'Users added to workspace',
        severity: 'success',
      });
    } catch (error) {
      showAppError(error, 'Failed to add users');
    } finally {
      setIsSavingMembers(false);
    }
  };

  const openMemberMenu = (event: MouseEvent<HTMLElement>, user: TeamUser) => {
    event.stopPropagation();
    setMemberMenu({ anchor: event.currentTarget, user });
  };

  const closeMemberMenu = () => {
    setMemberMenu(null);
  };

  const requestRemoveMember = () => {
    if (!memberMenu?.user.id) return;
    setMemberToRemove(memberMenu.user);
    setMemberMenu(null);
  };

  const submitRemoveMember = async () => {
    if (!memberToRemove?.id) return;
    setIsSavingMembers(true);
    try {
      const updatedWorkspace = await removeWorkspaceMember(workspace.id, memberToRemove.id);
      onWorkspaceChange?.(updatedWorkspace);
      setMemberToRemove(null);
      showAppNotification({ message: 'User removed from workspace', severity: 'success' });
    } catch (error) {
      showAppError(error, 'Failed to remove user');
    } finally {
      setIsSavingMembers(false);
    }
  };

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
          <WorkspaceActionPillButton startIcon={<AddIcon />} onClick={openAddDialog}>
            Add
          </WorkspaceActionPillButton>
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
              key={`${user.id ?? user.name}-${index}`}
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
              {canManageWorkspaceActions && user.id ? (
                <IconButton
                  size="small"
                  aria-label={`Open actions for ${user.name}`}
                  onClick={(event) => openMemberMenu(event, user)}
                  sx={{
                    width: 30,
                    height: 30,
                    color: 'text.secondary',
                    flexShrink: 0,
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              ) : null}
            </Box>
          );
        })}
      </Box>
      <Menu
        open={Boolean(memberMenu)}
        anchorEl={memberMenu?.anchor ?? null}
        onClose={closeMemberMenu}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2, py: 0.5 } } }}
      >
        <MenuItem
          disabled={memberMenu?.user.email === session?.email}
          onClick={requestRemoveMember}
          sx={{ color: 'error.main', fontSize: 13 }}
        >
          Remove from workspace
        </MenuItem>
      </Menu>
      <Dialog open={isAddOpen} onClose={closeAddDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Add users to workspace</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Select
            multiple
            fullWidth
            value={selectedUserIds}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedUserIds(
                (Array.isArray(value) ? value : String(value).split(',')).filter(Boolean).map(Number)
              );
            }}
            input={<OutlinedInput />}
            disabled={isLoadingAssignableUsers || isSavingMembers}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[]).map((id) => {
                  const user = assignableUsers.find((item) => item.id === id);
                  return <Chip key={id} size="small" label={user?.name ?? `#${id}`} />;
                })}
              </Box>
            )}
            sx={{ '& .MuiSelect-select': { minHeight: 34 } }}
          >
            {isLoadingAssignableUsers && (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Loading users
              </MenuItem>
            )}
            {!isLoadingAssignableUsers && availableUsers.length === 0 && (
              <MenuItem disabled>All assignable users are already in this workspace.</MenuItem>
            )}
            {availableUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{user.name}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{user.email}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <WorkspaceActionPillButton onClick={closeAddDialog} disabled={isSavingMembers}>
            Cancel
          </WorkspaceActionPillButton>
          <WorkspaceActionPillButton
            onClick={submitAddUsers}
            disabled={selectedUserIds.length === 0 || isSavingMembers}
          >
            {isSavingMembers ? 'Adding...' : 'Add to workspace'}
          </WorkspaceActionPillButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(memberToRemove)}
        onClose={() => !isSavingMembers && setMemberToRemove(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Remove user from workspace?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            {memberToRemove ? `${memberToRemove.name} will lose access to this workspace.` : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <WorkspaceActionPillButton onClick={() => setMemberToRemove(null)} disabled={isSavingMembers}>
            Cancel
          </WorkspaceActionPillButton>
          <WorkspaceActionPillButton onClick={submitRemoveMember} disabled={isSavingMembers}>
            {isSavingMembers ? 'Removing...' : 'Remove'}
          </WorkspaceActionPillButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default WorkspaceUsersSection;
