import { useEffect, useState } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { SettingsAppearanceCard } from '../components/settings/SettingsAppearanceCard';
import { SettingsNotificationsCard } from '../components/settings/SettingsNotificationsCard';
import { SettingsProfileEditModal } from '../components/settings/SettingsProfileEditModal';
import { SettingsProfileCard } from '../components/settings/SettingsProfileCard';
import { useAuth } from '../auth/useAuth';
import {
  getUserProfile,
  updateUserProfile,
  type NotificationSettings,
  type UpdateUserProfilePayload,
  type UserProfile,
} from '../services/userService';
import { showAppError, showAppNotification } from '../components/shared/appNotifications';

function Settings() {
  const { profile: currentProfile, hasRoleAtLeast, setProfile: setCurrentProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(currentProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!currentProfile);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile();
        if (mounted) {
          setProfile(userProfile);
          setCurrentProfile(userProfile);
        }
      } catch (error) {
        if (mounted) {
          showAppError(error, 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [setCurrentProfile]);

  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile);
    }
  }, [currentProfile]);

  const handleSaveProfile = async (updatedProfile: UpdateUserProfilePayload) => {
    if (!hasRoleAtLeast('TEAM_LEAD')) return;
    const savedProfile = await updateUserProfile(updatedProfile);
    setProfile(savedProfile);
    setCurrentProfile(savedProfile);
    setIsEditOpen(false);
    showAppNotification({ message: 'Profile updated', severity: 'success' });
  };

  const handleAvatarChange = async (avatarFile: File) => {
    if (!profile || isAvatarSaving) return;
    setIsAvatarSaving(true);
    try {
      const savedProfile = await updateUserProfile({
        name: profile.name,
        timezone: profile.timezone,
        avatarUrl: profile.avatarUrl,
        avatarFile,
        notifications: profile.notifications,
      });
      setProfile(savedProfile);
      setCurrentProfile(savedProfile);
      showAppNotification({ message: 'Profile photo updated', severity: 'success' });
    } catch (error) {
      showAppError(error, 'Failed to update profile photo');
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleNotificationsChange = async (notifications: NotificationSettings) => {
    if (!profile) return;

    const previousProfile = profile;
    const optimisticProfile = { ...profile, notifications };
    setProfile(optimisticProfile);
    setCurrentProfile(optimisticProfile);

    try {
      const savedProfile = await updateUserProfile({
        name: profile.name,
        timezone: profile.timezone,
        avatarUrl: profile.avatarUrl,
        notifications,
      });
      setProfile(savedProfile);
      setCurrentProfile(savedProfile);
    } catch (error) {
      setProfile(previousProfile);
      setCurrentProfile(previousProfile);
      showAppError(error, 'Failed to update notifications');
    }
  };

  if (isLoading || !profile) {
    return (
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={36} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

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
        variant="h2"
        data-page-title="true"
        sx={{ mb: 3 }}
      >
        Settings
      </Typography>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
        <Stack spacing={3} sx={{ flex: 1, width: '100%', maxWidth: { lg: 720 } }}>
          <SettingsProfileCard
            profile={profile}
            showEdit={hasRoleAtLeast('TEAM_LEAD')}
            isAvatarSaving={isAvatarSaving}
            onAvatarChange={handleAvatarChange}
            onEdit={() => {
              if (hasRoleAtLeast('TEAM_LEAD')) setIsEditOpen(true);
            }}
          />
          <SettingsAppearanceCard />
        </Stack>

        <SettingsProfileEditModal
          open={hasRoleAtLeast('TEAM_LEAD') && isEditOpen}
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
          <SettingsNotificationsCard value={profile.notifications} onChange={handleNotificationsChange} />
        </Stack>
      </Stack>
    </Box>
  );
}

export default Settings;
