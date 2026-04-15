import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import profilePhoto from '../../assets/settings/profile-photo.png';
import { SettingsCard } from './SettingsCard';
import { settingsMaroon as maroon } from './settingsTokens';

export type ProfileFields = {
  name: string;
  email: string;
  role: string;
  timezone: string;
};

type SettingsProfileCardProps = {
  profile: ProfileFields;
  onEdit?: () => void;
};

function SettingsProfileCard({ profile, onEdit }: SettingsProfileCardProps) {
  const [hoverAvatar, setHoverAvatar] = useState(false);

  return (
    <SettingsCard>
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: maroon,
            }}
          >
            Profile
          </Typography>
          <Button
            variant="contained"
            disableElevation
            onClick={onEdit}
            startIcon={<LockOutlinedIcon sx={{ fontSize: 17 }} />}
            sx={{
              bgcolor: maroon,
              borderRadius: '5px',
              minHeight: 28,
              px: 1.5,
              py: 0.25,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              '&:hover': { bgcolor: '#4a011f' },
            }}
          >
            Edit
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
          <Box
            sx={{ position: 'relative', width: 147, height: 148, flexShrink: 0 }}
            onMouseEnter={() => setHoverAvatar(true)}
            onMouseLeave={() => setHoverAvatar(false)}
          >
            <Avatar
              src={profilePhoto}
              alt={profile.name}
              sx={{
                width: 147,
                height: 148,
                border: `3px solid ${maroon}`,
                boxSizing: 'border-box',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: hoverAvatar ? 'rgba(0,0,0,0.35)' : 'transparent',
                transition: 'background-color 0.2s',
                pointerEvents: 'none',
              }}
            >
              {hoverAvatar ? (
                <EditOutlinedIcon sx={{ color: '#fff', fontSize: 32 }} />
              ) : null}
            </Box>
          </Box>

          <Stack spacing={1.25} sx={{ pt: { sm: 0.5 }, alignSelf: { sm: 'center' }, width: '100%' }}>
            <ProfileRow label="Name:" value={profile.name} />
            <ProfileRow label="Email:" value={profile.email} />
            <ProfileRow label="Role:" value={profile.role} />
            <ProfileRow label="Timezone:" value={profile.timezone} />
          </Stack>
        </Stack>
      </Box>
    </SettingsCard>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <Typography
      sx={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 15,
        color: maroon,
      }}
    >
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Box>{' '}
      <Box component="span" sx={{ fontWeight: 500 }}>
        {value}
      </Box>
    </Typography>
  );
}

export { SettingsProfileCard };
