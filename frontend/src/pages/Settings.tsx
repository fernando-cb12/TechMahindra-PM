import { Box, Button, Stack, Typography } from '@mui/material';
import { Sidebar } from '../components/layout/Sidebar';
import { SettingsAppearanceCard } from '../components/settings/SettingsAppearanceCard';
import { SettingsNotificationsCard } from '../components/settings/SettingsNotificationsCard';
import {
  SettingsProfileCard,
  type ProfileFields,
} from '../components/settings/SettingsProfileCard';
import { settingsMaroon as maroon } from '../components/settings/settingsTokens';

const defaultProfile: ProfileFields = {
  name: 'Antonio Calderon',
  email: 'antioniocraft@gmail.com',
  role: 'Developer',
  timezone: 'GMT-6',
};

type SettingsProps = {
  onNavItemClick?: (value: string) => void;
  onLogOut?: () => void;
  onProfileEdit?: () => void;
  profile?: ProfileFields;
};

function Settings({
  onNavItemClick,
  onLogOut,
  onProfileEdit,
  profile = defaultProfile,
}: SettingsProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeNavItem="settings" onNavItemClick={onNavItemClick} />
      <Box
        component="main"
        sx={{
          flex: 1,
          backgroundColor: '#f5f5f5',
          px: { xs: 2, sm: 4 },
          py: 3,
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 21.5,
            color: maroon,
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
            <SettingsProfileCard profile={profile} onEdit={onProfileEdit} />
            <SettingsAppearanceCard />
          </Stack>

          <Stack
            spacing={3}
            sx={{
              width: '100%',
              maxWidth: { lg: 340 },
              alignSelf: 'stretch',
            }}
          >
            <SettingsNotificationsCard />
            <Box sx={{ flexGrow: 1, minHeight: { lg: 24 } }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disableElevation
                onClick={onLogOut}
                sx={{
                  bgcolor: maroon,
                  borderRadius: '5px',
                  minWidth: 129,
                  minHeight: 30,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#4a011f' },
                }}
              >
                Log Out
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default Settings;
