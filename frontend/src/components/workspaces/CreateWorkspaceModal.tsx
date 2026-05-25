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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import loginBg from '../../assets/loginbg.png';
import type { AssignableUser, CreateWorkspaceProjectPayload } from '../../services/workspacesService';

type CreateWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateWorkspaceProjectPayload) => Promise<void>;
  assignableUsers: AssignableUser[];
  aiImportFileName?: string;
};

type FormData = {
  title: string;
  description: string;
  memberUserIds: number[];
  dueDate: string;
  budgetLabel: string;
  bannerFile: File | null;
};

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const tomorrowDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateInput(date);
};

const isFutureDate = (value: string): boolean => {
  const selected = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
};

function CreateWorkspaceModal({ open, onClose, onSave, assignableUsers, aiImportFileName }: CreateWorkspaceModalProps) {
  const [values, setValues] = useState<FormData>({
    title: '',
    description: '',
    memberUserIds: [],
    dueDate: '',
    budgetLabel: '',
    bannerFile: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setValues({
        title: '',
        description: '',
        memberUserIds: [],
        dueDate: '',
        budgetLabel: '',
        bannerFile: null,
      });
      setErrors({});
      setIsDraggingBanner(false);
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
    if (!values.title.trim()) newErrors.title = 'Project name is required';
    if (!values.description.trim()) newErrors.description = 'Description is required';
    if (values.memberUserIds.length === 0) newErrors.memberUserIds = 'At least one member is required';
    if (values.dueDate && !isFutureDate(values.dueDate)) newErrors.dueDate = 'Due date must be in the future';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBannerFileChange = (file: File | null) => {
    if (file && !file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, bannerFile: 'Banner file must be an image' }));
      return;
    }
    handleFieldChange('bannerFile', file);
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
        imageUrl: values.bannerFile ? undefined : loginBg,
        bannerFile: values.bannerFile,
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

          {aiImportFileName ? (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: 'text.primary' }}>
                AI File Loaded
              </Typography>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'text.secondary' }}>
                {aiImportFileName}. Review the fields and create your workspace.
              </Typography>
            </Box>
          ) : null}

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
              type="date"
              value={values.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              error={!!errors.dueDate}
              helperText={errors.dueDate}
              InputLabelProps={{ shrink: true, sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{
                min: tomorrowDate(),
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
                Banner Image
              </Typography>
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                  minHeight: 84,
                  px: 2,
                  py: 1.5,
                  border: '1.5px dashed',
                  borderColor: isDraggingBanner || values.bannerFile ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: isDraggingBanner || values.bannerFile ? 'rgba(95, 2, 41, 0.04)' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'border-color 160ms ease, background-color 160ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(95, 2, 41, 0.04)',
                  },
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingBanner(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingBanner(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingBanner(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingBanner(false);
                  handleBannerFileChange(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                    flex: '0 0 auto',
                  }}
                >
                  {values.bannerFile ? <ImageOutlinedIcon /> : <UploadFileOutlinedIcon />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {values.bannerFile
                      ? values.bannerFile.name
                      : isDraggingBanner
                      ? 'Drop image here'
                      : 'Choose or drag a banner image'}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.25,
                      color: 'text.secondary',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: 12,
                    }}
                  >
                    PNG, JPG, GIF, or WebP
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  component="span"
                  sx={{
                    textTransform: 'none',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    flex: '0 0 auto',
                  }}
                >
                  Browse
                </Button>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => handleBannerFileChange(event.target.files?.[0] ?? null)}
                />
              </Box>
              {errors.bannerFile && (
                <Typography sx={{ color: 'error.main', fontSize: 12, fontFamily: 'Montserrat, sans-serif', mt: 0.5 }}>
                  {errors.bannerFile}
                </Typography>
              )}
            </Box>
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
