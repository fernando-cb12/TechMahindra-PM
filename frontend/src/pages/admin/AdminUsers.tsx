import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { AdminUserStats } from '../../components/admin/AdminUserStats';
import { AdminUsersTable } from '../../components/admin/AdminUsersTable';
import { AdminUserFormModal } from '../../components/admin/AdminUserFormModal';
import { AdminDeleteUserDialog } from '../../components/admin/AdminDeleteUserDialog';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type CreateUserPayload,
  type ManagedUser,
  type UserStatus,
} from '../../services/adminUsersStore';

function AdminUsers() {
  const [allUsers, setAllUsers] = useState<ManagedUser[]>(() => listUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const refreshUsers = useCallback(() => {
    setAllUsers(listUsers());
  }, []);

  const users = useMemo(() => {
    return listUsers({
      name: searchQuery.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
  }, [allUsers, searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedUser(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setFormMode('edit');
    setSelectedUser(user);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleSaveUser = (payload: CreateUserPayload, userId?: number) => {
    setActionError(null);
    try {
      if (formMode === 'create') {
        createUser(payload);
      } else if (userId !== undefined) {
        updateUser(userId, {
          name: payload.name,
          status: payload.status,
          roles: payload.roles,
        });
      }
      refreshUsers();
      setIsFormOpen(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save user');
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) {
      return;
    }
    setActionError(null);
    try {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
      refreshUsers();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete user');
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 21.5,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.common.white
                  : theme.palette.primary.main,
            }}
          >
            User management
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 14,
              color: 'text.secondary',
              mt: 0.5,
            }}
          >
            Create, edit, and remove platform accounts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlinedIcon />}
          onClick={handleOpenCreate}
          sx={{
            textTransform: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Create user
        </Button>
      </Stack>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      <AdminUserStats users={allUsers} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: { md: 360 } }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="banned">Banned</MenuItem>
        </TextField>
      </Stack>

      <AdminUsersTable
        users={users}
        onEdit={handleOpenEdit}
        onDelete={setUserToDelete}
      />

      <AdminUserFormModal
        open={isFormOpen}
        mode={formMode}
        user={selectedUser}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveUser}
      />

      <AdminDeleteUserDialog
        open={userToDelete !== null}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

export default AdminUsers;
