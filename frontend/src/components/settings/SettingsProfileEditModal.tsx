import { useEffect, useState } from 'react';
import {
  Avatar,
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
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import type { UpdateUserProfilePayload, UserProfile } from '../../services/userService';

type SettingsProfileEditModalProps = {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UpdateUserProfilePayload) => Promise<void>;
};

const timezones = [
  'GMT-12',
  'GMT-8',
  'GMT-6',
  'GMT-4',
  'GMT',
  'GMT+1',
  'GMT+3',
  'GMT+5',
  'GMT+8',
  'GMT+10',
];

function SettingsProfileEditModal({ open, profile, onClose, onSave }: SettingsProfileEditModalProps) {
  const [values, setValues] = useState<UserProfile>(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setValues(profile);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setIsDraggingPhoto(false);
    setPhotoError('');
  }, [profile]);

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: values.name,
        timezone: values.timezone,
        avatarUrl: values.avatarUrl,
        avatarFile,
        notifications: values.notifications,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (file && !file.type.startsWith('image/')) {
      setPhotoError('Profile photo must be an image');
      return;
    }
    setPhotoError('');
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    if (!file) {
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      return;
    }
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

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
      <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20 }}>
        Edit Profile
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
            Adjust your personal settings and update how your profile appears across the app.
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'center' }}>
              <Avatar
                src={avatarPreviewUrl ?? values.avatarUrl ?? undefined}
                alt={values.name}
                sx={{
                  width: 92,
                  height: 92,
                  bgcolor: 'primary.main',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {values.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography
                  sx={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    mb: 1,
                    color: 'text.primary',
                  }}
                >
                  Profile Photo
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
                    borderColor: isDraggingPhoto || avatarFile ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: isDraggingPhoto || avatarFile ? 'rgba(95, 2, 41, 0.04)' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'border-color 160ms ease, background-color 160ms ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(95, 2, 41, 0.04)',
                    },
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingPhoto(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingPhoto(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDraggingPhoto(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingPhoto(false);
                    handleAvatarChange(event.dataTransfer.files?.[0] ?? null);
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
                    {avatarFile ? <ImageOutlinedIcon /> : <UploadFileOutlinedIcon />}
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
                      {avatarFile
                        ? avatarFile.name
                        : isDraggingPhoto
                        ? 'Drop image here'
                        : 'Choose or drag a profile photo'}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.25,
                        color: 'text.secondary',
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: 12,
                      }}
                    >
                      JPG, PNG, GIF, or WebP
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraOutlinedIcon />}
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
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                  />
                </Box>
                {photoError && (
                  <Typography sx={{ color: 'error.main', fontSize: 12, fontFamily: 'Montserrat, sans-serif', mt: 0.5 }}>
                    {photoError}
                  </Typography>
                )}
              </Box>
            </Stack>
            <TextField
              fullWidth
              label="Name"
              value={values.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              InputLabelProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={values.email}
              disabled
              InputLabelProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            />
            <TextField
              fullWidth
              label="Timezone"
              select
              value={values.timezone}
              onChange={(event) => handleFieldChange('timezone', event.target.value)}
              InputLabelProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
              inputProps={{ sx: { fontFamily: 'Montserrat, sans-serif' } }}
            >
              {timezones.map((zone) => (
                <MenuItem key={zone} value={zone}>
                  {zone}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              disabled
              fullWidth
              label="Role"
              value={values.role}
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
          disabled={isSaving}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            textTransform: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
          }}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export { SettingsProfileEditModal };
