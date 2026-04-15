import { useState } from 'react';
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
import { settingsMaroon as maroon } from './settingsTokens';

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
  initialState?: Partial<Record<NotificationKey, boolean>>;
};

function SettingsNotificationsCard({ initialState }: SettingsNotificationsCardProps) {
  const [flags, setFlags] = useState<Record<NotificationKey, boolean>>(() => ({
    issuesAssigned: true,
    mentions: true,
    projectUpdates: true,
    dailySummary: true,
    ...initialState,
  }));

  const toggle = (key: NotificationKey) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SettingsCard sx={{ minHeight: 200 }}>
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: maroon,
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
                    checked={flags[key]}
                    onChange={() => toggle(key)}
                    icon={
                      <Box
                        sx={{
                          width: 23,
                          height: 23,
                          border: `2px solid ${maroon}`,
                          borderRadius: '4px',
                          bgcolor: '#fff',
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
                      color: maroon,
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
