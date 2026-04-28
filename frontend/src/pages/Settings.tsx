import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ROUTES } from '../app/routes';
import { SettingsAppearanceCard } from '../components/settings/SettingsAppearanceCard';
import { SettingsNotificationsCard } from '../components/settings/SettingsNotificationsCard';
import {
  SettingsProfileCard,
  type ProfileFields,
} from '../components/settings/SettingsProfileCard';

const defaultProfile: ProfileFields = {
  name: 'Antonio Calderon',
  email: 'antioniocraft@gmail.com',
  role: 'Developer',
  timezone: 'GMT-6',
};

type SettingsProps = {
  onProfileEdit?: () => void;
  profile?: ProfileFields;
};

function Settings({ onProfileEdit, profile = defaultProfile }: SettingsProps) {
  const navigate = useNavigate();

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
                onClick={() => navigate(ROUTES.login)}
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: '5px',
                  minWidth: 129,
                  minHeight: 30,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                Log Out
              </Button>
            </Box>
          </Stack>
        </Stack>
    </Box>
  );
}

export default Settings;
