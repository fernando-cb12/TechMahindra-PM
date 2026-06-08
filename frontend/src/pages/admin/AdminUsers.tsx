import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { showAppNotification } from '../../components/shared/appNotifications';
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  updateManagedUser,
  type CreateUserPayload,
  type ManagedUser,
  type UserStatus,
} from '../../services/adminUsersService';

function AdminUsers() {
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await listManagedUsers();
      setAllUsers(data);
    } catch (error) {
      setAllUsers([]);
      setLoadError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const users = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [allUsers, searchQuery, statusFilter]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setFormMode('edit');
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleSaveUser = async (payload: CreateUserPayload, userId?: number) => {
    try {
      if (formMode === 'create') {
        await createManagedUser(payload);
        showAppNotification({ message: 'User created successfully', severity: 'success' });
      } else if (userId !== undefined) {
        await updateManagedUser(userId, {
          name: payload.name,
          status: payload.status,
          roles: payload.roles,
        });
        showAppNotification({ message: 'User updated successfully', severity: 'success' });
      }
      setIsFormOpen(false);
      await loadUsers();
    } catch {
      // Error toast is shown by apiClient interceptor
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteManagedUser(userToDelete.id);
      setUserToDelete(null);
      showAppNotification({ message: 'User deleted successfully', severity: 'success' });
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete user';
      showAppNotification({ message, severity: 'error' });
    } finally {
      setIsDeleting(false);
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
            variant="h2"
            data-page-title="true"
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
            fontFamily: 'Montserrat, sans-serif',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Create user
        </Button>
      </Stack>

      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
        </>
      )}

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
        isDeleting={isDeleting}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Box>
  );
}

export default AdminUsers;
