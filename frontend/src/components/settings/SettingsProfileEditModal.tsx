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
import type { UserProfile } from '../../services/userService';

type SettingsProfileEditModalProps = {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues(profile);
  }, [profile]);

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(values);
    } finally {
      setIsSaving(false);
    }
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
              onChange={(event) => handleFieldChange('email', event.target.value)}
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
