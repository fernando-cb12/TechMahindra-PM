import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import mahindraLogo from '../../assets/mahindralogobk.png';
import type { NavItem, Project, SidebarProps } from './types';
import { NAV_ITEM_TO_PATH } from '../../app/routes';
import { useAuth } from '../../auth/AuthContext';

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Workspaces', value: 'workspaces' },
  { label: 'Issues', value: 'issues' },
  { label: 'Metrics', value: 'metrics' },
  { label: 'Career', value: 'career' },
  { label: 'Settings', value: 'settings' },
];

const defaultProjects: Project[] = [
  {
    label: 'Magenta',
    id: 'magenta',
    subsections: [
      { label: 'Frontend Design', id: 'frontend' },
      { label: 'Backend', id: 'backend' },
      { label: 'Requirements Analytics', id: 'requirements' },
    ],
  },
  {
    label: 'Blue',
    id: 'blue',
    subsections: [
      { label: 'Frontend Design', id: 'frontend' },
      { label: 'Backend Design', id: 'backend' },
    ],
  },
  {
    label: 'Green',
    id: 'green',
    subsections: [
      { label: 'API Development', id: 'api' },
      { label: 'DevOps', id: 'devops' },
      { label: 'Testing', id: 'testing' },
    ],
  },
];

function Sidebar({
  activeNavItem = 'dashboard',
  activeProject = 'magenta',
  activeSubsection = 'frontend',
  onNavItemClick,
  onProjectClick,
  onSubsectionClick,
  onLogout,
  //userPoints = 250,
  navItems = defaultNavItems,
  projects = defaultProjects,
}: SidebarProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Derive display values from the JWT session (email is the sub claim)
  const emailPrefix = session?.email?.split('@')[0] ?? 'User';
  const userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const userInitials = emailPrefix.slice(0, 2).toUpperCase();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    magenta: true,
  });

  const handleProjectClick = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
    onProjectClick?.(projectId);
  };

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
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={mahindraLogo}
          alt="Tech Mahindra logo"
          sx={{ width: '100%', maxWidth: 140, height: 'auto' }}
        />
      </Box>

      {/* Main Navigation */}
      <Box component="nav" sx={{ flex: 1 }}>
        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.value}
              selected={item.value === activeNavItem}
              onClick={() => {
                const path = NAV_ITEM_TO_PATH[item.value];
                if (path) navigate(path);
                onNavItemClick?.(item.value);
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                px: 2,
                py: 1.2,
                '&.Mui-selected': {
                  backgroundColor: 'secondary.main',
                },
                '&:hover': {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
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
      </Box>

      {/* Workspaces Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            color: (theme) => alpha(theme.palette.common.white, 0.6),
            textTransform: 'uppercase',
            px: 2,
            mb: 1.5,
            letterSpacing: '0.5px',
          }}
        >
          Workspaces
        </Typography>

        <List disablePadding>
          {projects.map((project) => (
            <Box key={project.id}>
              <ListItemButton
                onClick={() => handleProjectClick(project.id)}
                selected={project.id === activeProject}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  px: 2,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'secondary.main',
                  },
                  '&:hover': {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.common.white, 0.15),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor:
                      project.id === activeProject
                        ? 'common.white'
                        : 'transparent',
                    border: (theme) =>
                      `2px solid ${theme.palette.common.white}`,
                    mr: 1.5,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={project.label}
                  primaryTypographyProps={{
                    fontSize: 11,
                    fontWeight: project.id === activeProject ? 600 : 400,
                    color: 'common.white',
                  }}
                />
                {expandedProjects[project.id] ? (
                  <ExpandLessIcon sx={{ fontSize: 18, ml: 1 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 18, ml: 1 }} />
                )}
              </ListItemButton>

              {/* Project Subsections */}
              <Collapse
                in={expandedProjects[project.id]}
                timeout="auto"
                unmountOnExit
              >
                <List disablePadding>
                  {project.subsections.map((subsection) => (
                    <ListItemButton
                      key={subsection.id}
                      onClick={() =>
                        onSubsectionClick?.(project.id, subsection.id)
                      }
                      selected={
                        project.id === activeProject &&
                        subsection.id === activeSubsection
                      }
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        ml: 2,
                        px: 2,
                        py: 0.8,
                        backgroundColor:
                          project.id === activeProject &&
                          subsection.id === activeSubsection
                            ? 'secondary.main'
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: (theme) =>
                            alpha(theme.palette.common.white, 0.1),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor:
                            project.id === activeProject &&
                            subsection.id === activeSubsection
                              ? 'common.white'
                              : (theme) =>
                                  alpha(theme.palette.common.white, 0.5),
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={subsection.label}
                        primaryTypographyProps={{
                          fontSize: 10,
                          fontWeight:
                            project.id === activeProject &&
                            subsection.id === activeSubsection
                              ? 600
                              : 400,
                          color: 'common.white',
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Box>

      {/* User Section */}
      <Divider
        sx={{
          borderColor: (theme) => alpha(theme.palette.common.white, 0.2),
          mb: 2,
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'secondary.main',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
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

        {/* Logout button */}
        <Tooltip title="Log out" placement="right">
          <IconButton
            id="sidebar-logout-btn"
            size="small"
            onClick={onLogout}
            aria-label="Log out"
            sx={{
              color: (theme) => alpha(theme.palette.common.white, 0.75),
              flexShrink: 0,
              '&:hover': {
                color: 'common.white',
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.12),
              },
              transition: 'color 0.2s, background-color 0.2s',
            }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export { Sidebar };

