import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AppRole } from '../../auth/auth';
import type { CreateUserPayload, ManagedUser, UserStatus } from '../../services/adminUsersStore';

type AdminUserFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  user: ManagedUser | null;
  onClose: () => void;
  onSave: (payload: CreateUserPayload, userId?: number) => void;
};

const ROLE_OPTIONS: AppRole[] = ['ADMIN', 'TEAM_LEAD', 'DEVELOPER', 'VIEW_ONLY'];
const STATUS_OPTIONS: UserStatus[] = ['active', 'inactive', 'banned'];

const roleLabels: Record<AppRole, string> = {
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team leader',
  DEVELOPER: 'Developer',
  VIEW_ONLY: 'View only',
};

type FormState = {
  name: string;
  email: string;
  status: UserStatus;
  role: AppRole;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  status: 'active',
  role: 'DEVELOPER',
};

function AdminUserFormModal({ open, mode, user, onClose, onSave }: AdminUserFormModalProps) {
  const [values, setValues] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setValues(emptyForm);
      setErrors({});
      return;
    }
    if (mode === 'edit' && user) {
      setValues({
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.roles[0] ?? 'DEVELOPER',
      });
    } else {
      setValues(emptyForm);
    }
  }, [open, mode, user]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) {
      nextErrors.name = 'Name is required';
    }
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }
    onSave(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        status: values.status,
        roles: [values.role],
      },
      user?.id,
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20 }}>
        {mode === 'create' ? 'Create user' : 'Edit user'}
      </DialogTitle>
      <DialogContent>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 14,
            color: 'text.secondary',
            mb: 2,
          }}
        >
          {mode === 'create'
            ? 'Add a new account and assign its role.'
            : 'Update account details and permissions.'}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Full name"
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            disabled={mode === 'edit'}
          />
          <TextField
            select
            label="Status"
            value={values.status}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, status: e.target.value as UserStatus }))
            }
            fullWidth
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Role"
            value={values.role}
            onChange={(e) => setValues((prev) => ({ ...prev, role: e.target.value as AppRole }))}
            fullWidth
          >
            {ROLE_OPTIONS.map((role) => (
              <MenuItem key={role} value={role}>
                {roleLabels[role]}
              </MenuItem>
            ))}
          </TextField>
          {mode === 'create' ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[700]
                    : theme.palette.grey[100],
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[300]
                      : theme.palette.text.secondary,
                }}
              >
                A temporary password will be sent to the user once account creation is connected to
                the API.
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            textTransform: 'none',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {mode === 'create' ? 'Create user' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { AdminUserFormModal };
