import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

type MetricRenameDialogProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function MetricRenameDialog({ open, value, onChange, onClose, onConfirm }: MetricRenameDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Rename Dashboard</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Name"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>Rename</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MetricRenameDialog;
