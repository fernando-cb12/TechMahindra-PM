import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { AppNotification } from './appNotifications';
import { subscribeToAppNotifications } from './appNotifications';

function AppSnackbar() {
  const [notification, setNotification] = useState<Required<AppNotification> | null>(null);

  useEffect(() => subscribeToAppNotifications(setNotification), []);

  return (
    <Snackbar
      open={Boolean(notification)}
      autoHideDuration={notification?.severity === 'error' ? 4500 : 3000}
      onClose={() => setNotification(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={notification?.severity ?? 'info'}
        variant="filled"
        onClose={() => setNotification(null)}
        sx={{ width: '100%', boxShadow: 'none' }}
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );
}

export default AppSnackbar;
