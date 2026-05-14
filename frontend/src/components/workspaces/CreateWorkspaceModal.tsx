import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  IconButton,
  Select,
  OutlinedInput,
  MenuItem,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import loginBg from '../../assets/loginbg.png';
import type { AssignableUser, CreateWorkspaceProjectPayload } from '../../services/workspacesService';

type CreateWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateWorkspaceProjectPayload) => Promise<void>;
  assignableUsers: AssignableUser[];
};

type FormData = {
  title: string;
  description: string;
  memberUserIds: number[];
  dueDate: string;
  budgetLabel: string;
  imageUrl: string;
};

function CreateWorkspaceModal({ open, onClose, onSave, assignableUsers }: CreateWorkspaceModalProps) {
  const [values, setValues] = useState<FormData>({
    title: '',
    description: '',
    memberUserIds: [],
    dueDate: '',
    budgetLabel: '',
    imageUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setValues({
        title: '',
        description: '',
        memberUserIds: [],
        dueDate: '',
        budgetLabel: '',
        imageUrl: '',
      });
      setErrors({});
    }
  }, [open]);

  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!values.title.trim()) newErrors.title = 'Nombre del proyecto es requerido';
    if (!values.description.trim()) newErrors.description = 'Descripción es requerida';
    if (values.memberUserIds.length === 0) newErrors.memberUserIds = 'Al menos un miembro es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        title: values.title,
        description: values.description,
        memberUserIds: values.memberUserIds,
        dueDate: values.dueDate || 'No date',
        budgetLabel: values.budgetLabel || '0k',
        imageUrl: values.imageUrl || loginBg,
        status: 'planning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nameById = (id: number) => assignableUsers.find((u) => u.id === id)?.name ?? `#${id}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 20,
        }}
      >
        Create Workspace
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 0 }}>
        <Box sx={{ pt: 1, pb: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 14,
              color: 'text.secondary',
              mb: 2,
            }}
          >
            Create a new workspace to organize your projects and collaborate with team members.
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Project Name"
              value={values.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              InputLabelProps={{
                sx: {
                  fontFamily: 'Montserrat, sans-serif',
                  '&::before': {
                    content: '"*"',
                    color: 'error.main',
                    marginRight: '4px',
                  },
                },
              }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={values.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              InputLabelProps={{
                sx: {
                  fontFamily: 'Montserrat, sans-serif',
                  '&::before': {
                    content: '"*"',
                    color: 'error.main',
                    marginRight: '4px',
                  },
                },
              }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />

            <Box>
              <Typography
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  mb: 1,
                  color: 'text.primary',
                }}
              >
                Team Members
                <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                  *
                </Box>
              </Typography>
              <Select
                multiple
                fullWidth
                value={values.memberUserIds}
                onChange={(e) => {
                  const raw = e.target.value;
                  const asArray = Array.isArray(raw) ? raw : String(raw).split(',');
                  handleFieldChange(
                    'memberUserIds',
                    asArray.filter((v) => v !== '').map((v) => Number(v)),
                  );
                }}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((id) => (
                      <Chip
                        key={id}
                        label={nameById(id)}
                        sx={{
                          fontFamily: 'Montserrat, sans-serif',
                          height: 24,
                        }}
                      />
                    ))}
                  </Box>
                )}
                sx={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {assignableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id} sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.memberUserIds && (
                <Typography sx={{ color: 'error.main', fontSize: 12, fontFamily: 'Montserrat, sans-serif', mt: 0.5 }}>
                  {errors.memberUserIds}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Due Date"
              type="text"
              placeholder="MM/DD/YYYY"
              value={values.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              InputLabelProps={{ shrink: true, sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '\\d{2}/\\d{2}/\\d{4}',
                placeholder: 'MM/DD/YYYY',
                sx: { fontFamily: 'Montserrat, sans-serif' },
              }}
            />

            <TextField
              fullWidth
              label="Development Budget"
              placeholder="e.g., 50k"
              value={values.budgetLabel}
              onChange={(e) => handleFieldChange('budgetLabel', e.target.value)}
              InputLabelProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />

            <TextField
              fullWidth
              label="Banner Image URL"
              placeholder="https://example.com/image.jpg"
              value={values.imageUrl}
              onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
              InputLabelProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            textTransform: 'none',
            color: 'text.primary',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || assignableUsers.length === 0}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            textTransform: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
          }}
        >
          {isSaving ? 'Creating...' : 'Create Workspace'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { CreateWorkspaceModal };
