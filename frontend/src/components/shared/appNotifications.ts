import type { AlertColor } from '@mui/material/Alert';

export type AppNotification = {
  message: string;
  severity?: AlertColor;
};

type NotificationListener = (notification: Required<AppNotification>) => void;

const listeners = new Set<NotificationListener>();
let lastNotification: { message: string; severity: AlertColor; at: number } | null = null;
let pendingNotification: Required<AppNotification> | null = null;

export function subscribeToAppNotifications(listener: NotificationListener): () => void {
  listeners.add(listener);
  if (pendingNotification) {
    listener(pendingNotification);
    pendingNotification = null;
  }
  return () => {
    listeners.delete(listener);
  };
}

export function showAppNotification(notification: AppNotification | string): void {
  const next = typeof notification === 'string'
    ? { message: notification, severity: 'info' as AlertColor }
    : { message: notification.message, severity: notification.severity ?? 'info' };

  if (!next.message.trim()) return;

  const now = Date.now();
  if (
    lastNotification &&
    lastNotification.message === next.message &&
    lastNotification.severity === next.severity &&
    now - lastNotification.at < 600
  ) {
    return;
  }

  lastNotification = { ...next, at: now };
  if (listeners.size === 0) {
    pendingNotification = next;
    return;
  }
  listeners.forEach((listener) => listener(next));
}

export function showAppError(error: unknown, fallback = 'Something went wrong'): void {
  showAppNotification({
    message: error instanceof Error ? error.message : fallback,
    severity: 'error',
  });
}
