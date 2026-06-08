import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppInboxNotification,
} from '../../services/notificationsService';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<AppInboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadNotificationCount());
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [items, count] = await Promise.all([getNotifications(), getUnreadNotificationCount()]);
      setNotifications(items);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCount();
    const interval = window.setInterval(() => void loadCount(), 30000);
    return () => window.clearInterval(interval);
  }, [loadCount]);

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    void loadNotifications();
  };

  const close = () => setAnchorEl(null);

  const handleNotificationClick = async (notification: AppInboxNotification) => {
    if (!notification.read) {
      const updated = await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => (item.id === notification.id ? updated : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    close();
    if (notification.linkPath) {
      navigate(notification.linkPath);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() })));
  };

  return (
    <>
      <Tooltip title="Notifications" placement="top">
        <IconButton
          size="small"
          onClick={open}
          aria-label="Notifications"
          sx={{
            color: (theme) => alpha(theme.palette.common.white, 0.78),
            flexShrink: 0,
            '&:hover': { color: 'common.white', backgroundColor: (theme) => alpha(theme.palette.common.white, 0.12) },
          }}
        >
          <Badge badgeContent={unreadCount} color="secondary" max={9}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 19 }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 2,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.22)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 15 }}>
            Notifications
          </Typography>
          <Tooltip title="Mark all read">
            <span>
              <IconButton size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <DoneAllOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Divider />
        <List disablePadding sx={{ maxHeight: 390, overflowY: 'auto' }}>
          {notifications.map((notification) => (
            <ListItemButton
              key={notification.id}
              onClick={() => void handleNotificationClick(notification)}
              sx={{
                alignItems: 'flex-start',
                gap: 1.25,
                px: 2,
                py: 1.35,
                bgcolor: notification.read ? 'background.paper' : (theme) => alpha(theme.palette.primary.main, 0.08),
                borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  mt: 0.7,
                  bgcolor: notification.read ? 'transparent' : 'secondary.main',
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 12.5, color: 'text.primary' }}>
                  {notification.title}
                </Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, color: 'text.secondary', mt: 0.35 }}>
                  {notification.body}
                </Typography>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10.5, color: 'text.disabled', mt: 0.6 }}>
                  {formatTime(notification.createdAt)}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
          {!loading && notifications.length === 0 && (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>
                No notifications yet
              </Typography>
            </Box>
          )}
          {loading && notifications.length === 0 && (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'text.secondary' }}>
                Loading...
              </Typography>
            </Box>
          )}
        </List>
        {notifications.length > 0 && (
          <Box sx={{ p: 1.25, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={close} sx={{ textTransform: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
              Close
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
