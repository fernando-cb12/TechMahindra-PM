import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { SettingsAppearanceCard } from '../components/settings/SettingsAppearanceCard';
import { SettingsNotificationsCard } from '../components/settings/SettingsNotificationsCard';
import { SettingsProfileEditModal } from '../components/settings/SettingsProfileEditModal';
import { SettingsProfileCard } from '../components/settings/SettingsProfileCard';
import { getUserProfile, updateUserProfile, type UserProfile } from '../services/userService';

const defaultProfile: UserProfile = {
  name: 'Antonio Calderon',
  email: 'antioniocraft@gmail.com',
  role: 'Developer',
  timezone: 'GMT-6',
};

function Settings() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!mounted) return;
      const userProfile = await getUserProfile();
      if (mounted) {
        setProfile(userProfile);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    const savedProfile = await updateUserProfile(updatedProfile);
    setProfile(savedProfile);
    setIsEditOpen(false);
  };

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 21.5,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
            mb: 3,
          }}
        >
          Settings
        </Typography>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={3}
          alignItems="flex-start"
        >
          <Stack spacing={3} sx={{ flex: 1, width: '100%', maxWidth: { lg: 720 } }}>
            <SettingsProfileCard profile={profile} onEdit={() => setIsEditOpen(true)} />
            <SettingsAppearanceCard />
          </Stack>
          <SettingsProfileEditModal
            open={isEditOpen}
            profile={profile}
            onClose={() => setIsEditOpen(false)}
            onSave={handleSaveProfile}
          />

          <Stack
            spacing={3}
            sx={{
              width: '100%',
              maxWidth: { lg: 340 },
              alignSelf: 'stretch',
            }}
          >
            <SettingsNotificationsCard />
          </Stack>
        </Stack>
    </Box>
  );
}

export default Settings;
