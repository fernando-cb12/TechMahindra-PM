import type { ReactNode } from 'react';
import {
  Box,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import mahindraLogo from '../../assets/mahindralogobk.png';
import { ROUTES } from '../../app/routes';
import { useAuth } from '../../auth/useAuth';

type AdminNavItem = {
  label: string;
  value: string;
  path: string;
  icon: ReactNode;
};

const adminNavItems: AdminNavItem[] = [
  {
    label: 'User management',
    value: 'users',
    path: ROUTES.admin,
    icon: <PeopleOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  },
  {
    label: 'Settings',
    value: 'settings',
    path: ROUTES.adminSettings,
    icon: <SettingsOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  },
];

function pathToAdminNavItem(pathname: string): string {
  if (pathname === ROUTES.adminSettings || pathname.startsWith(`${ROUTES.adminSettings}/`)) {
    return 'settings';
  }
  return 'users';
}

type AdminSidebarProps = {
  onLogout?: () => void;
};

function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile } = useAuth();
  const activeNavItem = pathToAdminNavItem(location.pathname);
  const emailPrefix = session?.email?.split('@')[0] ?? 'Admin';
  const userName = profile?.name ?? (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
  const userInitials = userName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        minWidth: 200,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'primary.main',
        color: 'common.white',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={mahindraLogo}
          alt="Tech Mahindra logo"
          sx={{ width: '100%', maxWidth: 140, height: 'auto' }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color: (theme) => alpha(theme.palette.common.white, 0.6),
          textTransform: 'uppercase',
          px: 2,
          mb: 1,
          letterSpacing: '0.5px',
        }}
      >
        Administration
      </Typography>

      <List disablePadding sx={{ flex: 1 }}>
        {adminNavItems.map((item) => (
          <ListItemButton
            key={item.value}
            selected={item.value === activeNavItem}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              px: 2,
              py: 1.2,
              '&.Mui-selected': { backgroundColor: 'secondary.main' },
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            {item.icon}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 12,
                fontWeight: item.value === activeNavItem ? 700 : 500,
                color: 'common.white',
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider
        sx={{
          borderColor: (theme) => alpha(theme.palette.common.white, 0.2),
          mb: 2,
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={profile?.avatarUrl ?? undefined}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'secondary.main',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: 'common.white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userName}
          </Typography>
          <Typography
            sx={{
              fontSize: 9,
              color: (theme) => alpha(theme.palette.common.white, 0.7),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {session?.email ?? ''}
          </Typography>
        </Box>
        <Tooltip title="Log out" placement="right">
          <IconButton
            size="small"
            onClick={onLogout}
            aria-label="Log out"
            sx={{
              color: (theme) => alpha(theme.palette.common.white, 0.75),
              '&:hover': {
                color: 'common.white',
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.12),
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export { AdminSidebar };
