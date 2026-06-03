import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material';
import notificationChecked from '../../assets/settings/notification-checked.png';
import { SettingsCard } from './SettingsCard';

const NOTIFICATION_KEYS = [
  'issuesAssigned',
  'mentions',
  'projectUpdates',
  'dailySummary',
] as const;

type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

const LABELS: Record<NotificationKey, string> = {
  issuesAssigned: 'Issues assigned to me',
  mentions: 'Mentions in comments',
  projectUpdates: 'Project Updates',
  dailySummary: 'Daily summary email',
};

type SettingsNotificationsCardProps = {
  value: Record<NotificationKey, boolean>;
  onChange: (next: Record<NotificationKey, boolean>) => void;
};

function SettingsNotificationsCard({ value, onChange }: SettingsNotificationsCardProps) {
  const toggle = (key: NotificationKey) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <SettingsCard sx={{ minHeight: 200 }}>
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
            mb: 2,
          }}
        >
          Notifications
        </Typography>

        <FormGroup>
          <Stack spacing={0.5}>
            {NOTIFICATION_KEYS.map((key) => (
              <FormControlLabel
                key={key}
                sx={{
                  ml: 0,
                  mr: 0,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'row-reverse',
                  '& .MuiFormControlLabel-label': { flex: 1 },
                }}
                control={
                  <Checkbox
                    checked={value[key]}
                    onChange={() => toggle(key)}
                    icon={
                      <Box
                        sx={{
                          width: 23,
                          height: 23,
                          border: (theme) => `2px solid ${theme.palette.primary.main}`,
                          borderRadius: '4px',
                          bgcolor: 'common.white',
                        }}
                      />
                    }
                    checkedIcon={
                      <Box
                        component="img"
                        src={notificationChecked}
                        alt=""
                        sx={{ width: 23, height: 23, display: 'block' }}
                      />
                    }
                    sx={{ p: 0.5 }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 600,
                      fontSize: 15,
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? theme.palette.text.primary
                          : theme.palette.primary.main,
                    }}
                  >
                    {LABELS[key]}
                  </Typography>
                }
              />
            ))}
          </Stack>
        </FormGroup>
      </Box>
    </SettingsCard>
  );
}

export { SettingsNotificationsCard };
export type { NotificationKey };
