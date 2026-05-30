import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { ManagedUser } from '../../services/adminUsersStore';

type AdminDeleteUserDialogProps = {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onConfirm: () => void;
};

function AdminDeleteUserDialog({ open, user, onClose, onConfirm }: AdminDeleteUserDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
        Delete user
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>
          Are you sure you want to permanently delete{' '}
          <strong>{user?.name ?? 'this user'}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{ textTransform: 'none' }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { AdminDeleteUserDialog };
