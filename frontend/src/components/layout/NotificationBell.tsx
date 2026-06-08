import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Menu,
  MenuItem,
  Popover,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
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

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function resolveNotificationLink(notification: AppInboxNotification) {
  const taskId = getMetadataString(notification.metadata, 'taskId');
  if (!taskId) return notification.linkPath;

  const workspaceId = getMetadataString(notification.metadata, 'workspaceId');
  const boardId = getMetadataString(notification.metadata, 'boardId');
  if (workspaceId && boardId) {
    return `/workspaces/${workspaceId}/boards/${boardId}?task=${encodeURIComponent(taskId)}`;
  }

  if (!notification.linkPath) return null;
  const [path, query = ''] = notification.linkPath.split('?');
  const params = new URLSearchParams(query);
  params.set('task', taskId);
  return `${path}?${params.toString()}`;
}

function getNotificationKind(eventType: string) {
  if (eventType.includes('mention')) {
    return { label: 'Mention', icon: <AlternateEmailOutlinedIcon sx={{ fontSize: 16 }} /> };
  }
  if (eventType.includes('assigned')) {
    return { label: 'Assignment', icon: <AssignmentOutlinedIcon sx={{ fontSize: 16 }} /> };
  }
  return { label: 'Update', icon: <NotificationsNoneOutlinedIcon sx={{ fontSize: 16 }} /> };
}

function sortNotifications(items: AppInboxNotification[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<AppInboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; notification: AppInboxNotification } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<{ items: AppInboxNotification[]; message: string } | null>(null);
  const pendingDeleteRef = useRef<{ ids: string[]; timeoutId: number } | null>(null);

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
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  const commitPendingDelete = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeoutId);
    pendingDeleteRef.current = null;
    void Promise.all(pending.ids.map((id) => deleteNotification(id))).catch(() => {
      void loadNotifications();
    });
  }, [loadNotifications]);

  useEffect(() => {
    void loadCount();
    const interval = window.setInterval(() => void loadCount(), 30000);
    return () => {
      window.clearInterval(interval);
      commitPendingDelete();
    };
  }, [loadCount, commitPendingDelete]);

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    void loadNotifications();
  };

  const close = () => setAnchorEl(null);

  const openNotification = async (notification: AppInboxNotification) => {
    if (!notification.read) {
      const updated = await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => (item.id === notification.id ? updated : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    close();
    const linkPath = resolveNotificationLink(notification);
    if (linkPath) {
      navigate(linkPath);
    }
  };

  const handleNotificationClick = async (notification: AppInboxNotification) => {
    await openNotification(notification);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() })));
  };

  const handleToggleReadState = async (notification: AppInboxNotification) => {
    const updated = notification.read
      ? await markNotificationUnread(notification.id)
      : await markNotificationRead(notification.id);
    setNotifications((items) => items.map((item) => (item.id === notification.id ? updated : item)));
    setUnreadCount((count) => notification.read ? count + 1 : Math.max(0, count - 1));
    setContextMenu(null);
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(notificationId)) next.delete(notificationId);
      else next.add(notificationId);
      return next;
    });
  };

  const scheduleDelete = (itemsToDelete: AppInboxNotification[]) => {
    if (itemsToDelete.length === 0) return;
    commitPendingDelete();
    const idsToDelete = new Set(itemsToDelete.map((item) => item.id));
    setNotifications((items) => items.filter((item) => !idsToDelete.has(item.id)));
    setSelectedIds(new Set());
    setContextMenu(null);
    setConfirmDeleteOpen(false);
    setUnreadCount((count) => Math.max(0, count - itemsToDelete.filter((item) => !item.read).length));

    const timeoutId = window.setTimeout(() => {
      const pending = pendingDeleteRef.current;
      if (!pending) return;
      pendingDeleteRef.current = null;
      void Promise.all(pending.ids.map((id) => deleteNotification(id))).catch(() => {
        void loadNotifications();
      });
    }, 6000);

    pendingDeleteRef.current = { ids: itemsToDelete.map((item) => item.id), timeoutId };
    setDeleteNotice({
      items: itemsToDelete,
      message: itemsToDelete.length === 1 ? 'Notification deleted' : `${itemsToDelete.length} notifications deleted`,
    });
  };

  const undoDelete = () => {
    const pending = pendingDeleteRef.current;
    if (!pending || !deleteNotice) return;
    window.clearTimeout(pending.timeoutId);
    pendingDeleteRef.current = null;
    setNotifications((items) => sortNotifications([...deleteNotice.items, ...items]));
    setUnreadCount((count) => count + deleteNotice.items.filter((item) => !item.read).length);
    setDeleteNotice(null);
  };

  const selectedNotifications = notifications.filter((notification) => selectedIds.has(notification.id));
  const selectedCount = selectedIds.size;

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
              width: 390,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.7),
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 16, color: 'text.primary' }}>
              Notifications
            </Typography>
            <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, color: 'text.secondary', mt: 0.25 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<DoneAllOutlinedIcon sx={{ fontSize: 17 }} />}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 11.5,
              px: 1.25,
              minWidth: 0,
            }}
          >
            Read all
          </Button>
        </Box>
        <Divider />
        <List
          disablePadding
          sx={{
            maxHeight: 410,
            overflowY: 'auto',
            px: 1.25,
            py: 1.25,
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.black, 0.08)
              : alpha(theme.palette.grey[100], 0.75),
          }}
        >
          {notifications.map((notification) => {
            const kind = getNotificationKind(notification.eventType);
            const hasLink = Boolean(resolveNotificationLink(notification));
            const isSelected = selectedIds.has(notification.id);
            return (
              <ListItemButton
                key={notification.id}
                onClick={() => void handleNotificationClick(notification)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, notification });
                }}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.25,
                  px: 1.35,
                  py: 1.25,
                  mb: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: (theme) => isSelected
                    ? theme.palette.primary.main
                    : notification.read
                      ? alpha(theme.palette.divider, 0.65)
                      : alpha(theme.palette.primary.main, 0.35),
                  bgcolor: (theme) => notification.read
                    ? isSelected ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper
                    : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.07),
                  boxShadow: isSelected || !notification.read ? '0 8px 22px rgba(95, 2, 41, 0.10)' : 'none',
                  transition: 'background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.1),
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSelection(notification.id);
                  }}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: notification.read ? 'text.secondary' : 'primary.main',
                    bgcolor: (theme) => notification.read
                      ? isSelected ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.text.secondary, 0.09)
                      : alpha(theme.palette.primary.main, 0.12),
                    flexShrink: 0,
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                  }}
                >
                  {isSelected ? <CheckCircleOutlineIcon sx={{ fontSize: 17 }} /> : kind.icon}
                  {!notification.read && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        border: '2px solid',
                        borderColor: 'background.paper',
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 12.5, color: 'text.primary', lineHeight: 1.35 }} noWrap>
                      {notification.title}
                    </Typography>
                    {hasLink && (
                      <OpenInNewOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, color: 'text.secondary', mt: 0.45, lineHeight: 1.45 }}>
                    {notification.body}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.9 }}>
                    <Typography
                      sx={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: notification.read ? 'text.disabled' : 'primary.main',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 999,
                        bgcolor: (theme) => notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      {kind.label}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10.5, color: 'text.disabled', flexShrink: 0 }}>
                      {formatTime(notification.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </ListItemButton>
            );
          })}
          {!loading && notifications.length === 0 && (
            <Box sx={{ px: 2, py: 5, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 1 }} />
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: 'text.secondary' }}>
                No notifications yet
              </Typography>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, color: 'text.disabled', mt: 0.5 }}>
                Task mentions and assignments will appear here.
              </Typography>
            </Box>
          )}
          {loading && notifications.length === 0 && (
            <Box sx={{ px: 2, py: 5, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'text.secondary' }}>
                Loading...
              </Typography>
            </Box>
          )}
        </List>
        {notifications.length > 0 && (
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {selectedCount > 0 ? (
              <>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 800, color: 'primary.main' }}>
                  {selectedCount} selected
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setConfirmDeleteOpen(true)}
                    sx={{ textTransform: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}
                  >
                    Delete
                  </Button>
                  <Button size="small" onClick={() => setSelectedIds(new Set())} sx={{ textTransform: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                    Clear
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: 'text.disabled' }}>
                  Showing latest {notifications.length}
                </Typography>
                <Button size="small" onClick={close} sx={{ textTransform: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
                  Close
                </Button>
              </>
            )}
          </Box>
        )}
      </Popover>
      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        slotProps={{ paper: { sx: { minWidth: 170, borderRadius: 2, py: 0.5 } } }}
      >
        <MenuItem
          onClick={() => {
            const notification = contextMenu?.notification;
            setContextMenu(null);
            if (notification) void openNotification(notification);
          }}
        >
          <OpenInNewOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Open</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const notification = contextMenu?.notification;
            if (notification) void handleToggleReadState(notification);
          }}
        >
          {contextMenu?.notification.read ? (
            <MarkEmailUnreadOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          ) : (
            <MarkEmailReadOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          )}
          <Typography sx={{ fontSize: 13 }}>
            {contextMenu?.notification.read ? 'Mark unread' : 'Mark read'}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu?.notification) {
              scheduleDelete([contextMenu.notification]);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1.25 }} />
          <Typography sx={{ fontSize: 13 }}>Delete</Typography>
        </MenuItem>
      </Menu>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 17 }}>
          Delete notifications?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: 'text.secondary' }}>
            This will remove {selectedCount} selected {selectedCount === 1 ? 'notification' : 'notifications'} from your inbox.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => scheduleDelete(selectedNotifications)}
            sx={{ textTransform: 'none', fontWeight: 800 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(deleteNotice)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setDeleteNotice(null);
        }}
        message={deleteNotice?.message ?? ''}
        action={
          <Button
            size="small"
            onClick={undoDelete}
            sx={{
              color: 'primary.main',
              bgcolor: 'common.white',
              fontWeight: 900,
              px: 1.25,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Undo
          </Button>
        }
      />
    </>
  );
}
