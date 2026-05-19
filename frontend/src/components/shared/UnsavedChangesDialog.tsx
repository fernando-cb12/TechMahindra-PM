import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface UnsavedChangesDialogProps {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

function UnsavedChangesDialog({ open, onCancel, onDiscard, onSave }: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        onCancel();
      }}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          p: 0,
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>Unsaved changes</DialogTitle>
      <DialogContent sx={{ px: 3, pb: 0 }}>
        <Typography
          sx={{
            fontSize: 15,
            lineHeight: 1.6,
            color: 'text.primary',
          }}
        >
          You have made changes, Do you want to discard or save them?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3, pt: 2 }}>
        <Button variant="text" onClick={onCancel} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onDiscard} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Discard
          </Button>
          <Button variant="contained" onClick={onSave} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default UnsavedChangesDialog;
