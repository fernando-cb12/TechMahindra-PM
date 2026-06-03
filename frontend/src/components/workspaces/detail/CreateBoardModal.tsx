import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type CreateBoardModalProps = {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

function CreateBoardModal({ open, isSaving, onClose, onSave }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setError('');
    }
  }, [open]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Board name is required');
      return;
    }
    await onSave(trimmed);
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        Create Board
        <IconButton onClick={onClose} size="small" disabled={isSaving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
          Create a new board for this workspace.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Board name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError('');
          }}
          error={Boolean(error)}
          helperText={error}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSave();
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSaving} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={isSaving} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {isSaving ? 'Creating...' : 'Create board'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateBoardModal;
