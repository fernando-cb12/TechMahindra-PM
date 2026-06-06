import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type MetricDeleteDialogProps = {
  open: boolean;
  dashboardName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

function MetricDeleteDialog({ open, dashboardName, onClose, onConfirm }: MetricDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete Dashboard</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          This will delete "{dashboardName}" for your account. This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MetricDeleteDialog;
