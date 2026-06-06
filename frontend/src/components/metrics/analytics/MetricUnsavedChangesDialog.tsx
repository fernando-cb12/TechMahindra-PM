import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type MetricUnsavedChangesDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  saveLabel?: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

function MetricUnsavedChangesDialog({
  open,
  title = 'Unsaved Changes',
  message = 'Save the current Metrics dashboard before switching views, or discard the local changes.',
  saveLabel = 'Save',
  onCancel,
  onDiscard,
  onSave,
}: MetricUnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onDiscard}>Discard</Button>
        <Button variant="contained" onClick={onSave}>{saveLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MetricUnsavedChangesDialog;
