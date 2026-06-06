import type { ReactNode } from 'react';
import { useMemo, useState, type MouseEvent } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import mahindraLogo from '../../assets/mahindralogobk.png';
import type { NavItem, Project, ProjectSubsection, SidebarProps } from './types';
import { NAV_ITEM_TO_PATH } from '../../app/routes';
import { useAuth } from '../../auth/useAuth';

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Workspaces', value: 'workspaces' },
  { label: 'My Tasks', value: 'issues' },
  { label: 'Metrics', value: 'metrics' },
  { label: 'Career', value: 'career' },
  { label: 'Settings', value: 'settings' },
];

const navItemIcons: Record<string, ReactNode> = {
  dashboard: <DashboardOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  workspaces: <WorkOutlineOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  issues: <AssignmentOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  metrics: <BarChartOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  career: <EmojiEventsOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  settings: <SettingsOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
  rewards: <RedeemOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />,
};

const defaultProjects: Project[] = [
  { label: 'Magenta', id: 'magenta', subsections: [{ label: 'Frontend Design', id: 'frontend' }] },
];

type WorkspaceMenuState = { anchor: HTMLElement; project: Project } | null;
type BoardMenuState = { anchor: HTMLElement; project: Project; board: ProjectSubsection } | null;
type RenameState =
  | { type: 'workspace'; project: Project; value: string }
  | { type: 'board'; project: Project; board: ProjectSubsection; value: string }
  | null;

function readStoredIds(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

function Sidebar({
  activeNavItem = 'dashboard',
  activeProject,
  activeSubsection,
  onNavItemClick,
  onProjectClick,
  onSubsectionClick,
  onWorkspaceOpen,
  onWorkspaceCreateBoard,
  onWorkspaceCreateWorkspace,
  onWorkspaceRename,
  onWorkspaceDelete,
  onBoardRename,
  onBoardDelete,
  onCopyLink,
  onLogout,
  navItems = defaultNavItems,
  projects = defaultProjects,
}: SidebarProps) {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const emailPrefix = session?.email?.split('@')[0] ?? 'User';
  const userName = profile?.name ?? (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
  const userInitials = userName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const storageUser = session?.email ?? 'anonymous';
  const pinnedStorageKey = `sidebar_pinned_workspaces_${storageUser}`;
  const recentStorageKey = `sidebar_recent_workspaces_${storageUser}`;

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [manualToggles, setManualToggles] = useState<Set<string>>(new Set());
  const [workspaceMenu, setWorkspaceMenu] = useState<WorkspaceMenuState>(null);
  const [boardMenu, setBoardMenu] = useState<BoardMenuState>(null);
  const [renameState, setRenameState] = useState<RenameState>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readStoredIds(pinnedStorageKey));
  const [recentIds, setRecentIds] = useState<string[]>(() => readStoredIds(recentStorageKey));
  const contextMenuSlotProps = { paper: { sx: { minWidth: 220, borderRadius: 2, py: 0.5 } } };
  const menuIconSx = { fontSize: 18, mr: 1.25, color: 'text.secondary' };
  const dangerIconSx = { fontSize: 18, mr: 1.25 };

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const pinnedProjects = pinnedIds.map((id) => projectById.get(id)).filter((project): project is Project => Boolean(project));
  const recentProjects = recentIds
    .filter((id) => !pinnedIdSet.has(id))
    .map((id) => projectById.get(id))
    .filter((project): project is Project => Boolean(project));
  const recentIdSet = useMemo(() => new Set(recentProjects.map((project) => project.id)), [recentProjects]);
  const allProjects = projects.filter((project) => !pinnedIdSet.has(project.id) && !recentIdSet.has(project.id));
  const visibleExpandedProjects = useMemo(() => {
    if (!activeProject || manualToggles.has(activeProject)) return expandedProjects;
    return { ...expandedProjects, [activeProject]: true };
  }, [activeProject, expandedProjects, manualToggles]);

  const rememberRecent = (projectId: string) => {
    if (pinnedIds.includes(projectId) || !projectById.has(projectId)) return;
    setRecentIds((prev) => {
      const next = [projectId, ...prev.filter((id) => id !== projectId)].slice(0, 5);
      writeStoredIds(recentStorageKey, next);
      return next;
    });
  };

  const handleProjectToggle = (projectId: string) => {
    rememberRecent(projectId);
    setManualToggles((prev) => new Set(prev).add(projectId));
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
    onProjectClick?.(projectId);
  };

  const openWorkspaceMenu = (event: MouseEvent<HTMLElement>, project: Project) => {
    event.preventDefault();
    event.stopPropagation();
    setWorkspaceMenu({ anchor: event.currentTarget, project });
  };

  const openBoardMenu = (event: MouseEvent<HTMLElement>, project: Project, board: ProjectSubsection) => {
    event.preventDefault();
    event.stopPropagation();
    setBoardMenu({ anchor: event.currentTarget, project, board });
  };

  const isPinned = (projectId: string) => pinnedIds.includes(projectId);

  const togglePin = (projectId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [projectId, ...prev];
      writeStoredIds(pinnedStorageKey, next);
      return next;
    });
    setRecentIds((prev) => {
      const next = prev.filter((id) => id !== projectId);
      writeStoredIds(recentStorageKey, next);
      return next;
    });
  };

  const saveRename = () => {
    if (!renameState) return;
    const nextName = renameState.value.trim();
    if (!nextName) return;
    if (renameState.type === 'workspace') {
      onWorkspaceRename?.(renameState.project.id, nextName);
    } else {
      onBoardRename?.(renameState.project.id, renameState.board.id, nextName);
    }
    setRenameState(null);
  };

  const renderSectionHeader = (label: string) => (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 800,
        color: (theme) => alpha(theme.palette.common.white, 0.58),
        textTransform: 'uppercase',
        px: 2,
        mt: 1.4,
        mb: 0.65,
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </Typography>
  );

  const renderWorkspaceRow = (project: Project, options?: { compact?: boolean; showBoards?: boolean }) => (
    <Box key={`${options?.compact ? 'compact' : 'all'}-${project.id}`}>
      <ListItemButton
        onClick={() => {
          if (options?.showBoards) {
            handleProjectToggle(project.id);
            return;
          }
          rememberRecent(project.id);
          onWorkspaceOpen?.(project.id);
        }}
        onContextMenu={(event) => openWorkspaceMenu(event, project)}
        selected={project.id === activeProject}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          px: 2,
          py: options?.compact ? 0.75 : 1,
          '&.Mui-selected': { backgroundColor: 'secondary.main' },
          '&:hover': { backgroundColor: (theme) => alpha(theme.palette.common.white, 0.15) },
        }}
      >
        <Box
          sx={{
            width: options?.compact ? 8 : 12,
            height: options?.compact ? 8 : 12,
            borderRadius: '50%',
            backgroundColor: project.id === activeProject ? 'common.white' : 'transparent',
            border: (theme) => `2px solid ${theme.palette.common.white}`,
            mr: 1.25,
            flexShrink: 0,
          }}
        />
        <ListItemText
          primary={project.label}
          primaryTypographyProps={{
            fontSize: options?.compact ? 10.5 : 11,
            fontWeight: project.id === activeProject ? 700 : 500,
            color: 'common.white',
            noWrap: true,
          }}
        />
        {isPinned(project.id) && <PushPinIcon sx={{ fontSize: 12, mr: 0.5, opacity: 0.75 }} />}
        {options?.showBoards && (
          visibleExpandedProjects[project.id] ? <ExpandLessIcon sx={{ fontSize: 18, ml: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 18, ml: 0.5 }} />
        )}
      </ListItemButton>

      {options?.showBoards && (
        <Collapse in={Boolean(visibleExpandedProjects[project.id])} timeout="auto" unmountOnExit>
          <List disablePadding>
            {project.subsections.map((subsection) => (
              <ListItemButton
                key={subsection.id}
                onClick={() => {
                  rememberRecent(project.id);
                  onSubsectionClick?.(project.id, subsection.id);
                }}
                onContextMenu={(event) => openBoardMenu(event, project, subsection)}
                selected={project.id === activeProject && subsection.id === activeSubsection}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  ml: 2,
                  px: 2,
                  py: 0.8,
                  backgroundColor: project.id === activeProject && subsection.id === activeSubsection ? 'secondary.main' : 'transparent',
                  '&:hover': { backgroundColor: (theme) => alpha(theme.palette.common.white, 0.1) },
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: project.id === activeProject && subsection.id === activeSubsection
                      ? 'common.white'
                      : (theme) => alpha(theme.palette.common.white, 0.5),
                    mr: 1.5,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={subsection.label}
                  primaryTypographyProps={{ fontSize: 10, fontWeight: 500, color: 'common.white', noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );

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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box component="img" src={mahindraLogo} alt="Tech Mahindra logo" sx={{ width: '100%', maxWidth: 140, height: 'auto' }} />
      </Box>

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
                '&.Mui-selected': { backgroundColor: 'secondary.main' },
                '&:hover': { backgroundColor: (theme) => alpha(theme.palette.common.white, 0.1) },
              }}
            >
              {navItemIcons[item.value]}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 12, fontWeight: item.value === activeNavItem ? 700 : 500, color: 'common.white' }}
              />
            </ListItemButton>
          ))}
        </List>

        {projects.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 800,
                color: (theme) => alpha(theme.palette.common.white, 0.7),
                textTransform: 'uppercase',
                px: 2,
                mb: 0.75,
                letterSpacing: '0.5px',
              }}
            >
              Workspaces
            </Typography>

            <List disablePadding>
              {pinnedProjects.length > 0 && (
                <>
                  {renderSectionHeader('Pinned')}
                  {pinnedProjects.map((project) => renderWorkspaceRow(project, { compact: true, showBoards: true }))}
                </>
              )}
              {recentProjects.length > 0 && (
                <>
                  {renderSectionHeader('Recent')}
                  {recentProjects.map((project) => renderWorkspaceRow(project, { compact: true, showBoards: true }))}
                </>
              )}
              {allProjects.length > 0 && (
                <>
                  {renderSectionHeader('All')}
                  {allProjects.map((project) => renderWorkspaceRow(project, { showBoards: true }))}
                </>
              )}
            </List>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: (theme) => alpha(theme.palette.common.white, 0.2), mb: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={profile?.avatarUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {userInitials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'common.white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </Typography>
          <Typography sx={{ fontSize: 9, color: (theme) => alpha(theme.palette.common.white, 0.7), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.email ?? ''}
          </Typography>
        </Box>
        <Tooltip title="Log out" placement="right">
          <IconButton id="sidebar-logout-btn" size="small" onClick={onLogout} aria-label="Log out" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.75), flexShrink: 0, '&:hover': { color: 'common.white', backgroundColor: (theme) => alpha(theme.palette.common.white, 0.12) } }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu open={Boolean(workspaceMenu)} anchorEl={workspaceMenu?.anchor ?? null} onClose={() => setWorkspaceMenu(null)} slotProps={contextMenuSlotProps}>
        <MenuItem onClick={() => { if (workspaceMenu) { rememberRecent(workspaceMenu.project.id); onWorkspaceOpen?.(workspaceMenu.project.id); } setWorkspaceMenu(null); }}>
          <OpenInNewIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Open workspace</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (workspaceMenu) onWorkspaceCreateBoard?.(workspaceMenu.project.id); setWorkspaceMenu(null); }}>
          <DashboardCustomizeIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Create board</Typography>
        </MenuItem>
        <MenuItem onClick={() => { onWorkspaceCreateWorkspace?.(); setWorkspaceMenu(null); }}>
          <AddCircleOutlineIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Create workspace</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (workspaceMenu) setRenameState({ type: 'workspace', project: workspaceMenu.project, value: workspaceMenu.project.label }); setWorkspaceMenu(null); }}>
          <DriveFileRenameOutlineIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Rename</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (workspaceMenu) togglePin(workspaceMenu.project.id); setWorkspaceMenu(null); }}>
          <PushPinIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>{workspaceMenu && isPinned(workspaceMenu.project.id) ? 'Unpin workspace' : 'Pin workspace'}</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (workspaceMenu) onCopyLink?.(`/workspaces/${workspaceMenu.project.id}`); setWorkspaceMenu(null); }}>
          <LinkIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Copy link</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (workspaceMenu) onWorkspaceDelete?.(workspaceMenu.project.id); setWorkspaceMenu(null); }}>
          <DeleteOutlineIcon sx={dangerIconSx} />
          <Typography sx={{ fontSize: 13 }}>Delete</Typography>
        </MenuItem>
      </Menu>

      <Menu open={Boolean(boardMenu)} anchorEl={boardMenu?.anchor ?? null} onClose={() => setBoardMenu(null)} slotProps={contextMenuSlotProps}>
        <MenuItem onClick={() => { if (boardMenu) setRenameState({ type: 'board', project: boardMenu.project, board: boardMenu.board, value: boardMenu.board.label }); setBoardMenu(null); }}>
          <DriveFileRenameOutlineIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Rename</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (boardMenu) onCopyLink?.(`/workspaces/${boardMenu.project.id}/boards/${boardMenu.board.id}`); setBoardMenu(null); }}>
          <LinkIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Copy link</Typography>
        </MenuItem>
        <MenuItem disabled>
          <ContentCopyIcon sx={menuIconSx} />
          <Typography sx={{ fontSize: 13 }}>Duplicate board</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (boardMenu) onBoardDelete?.(boardMenu.project.id, boardMenu.board.id); setBoardMenu(null); }}>
          <DeleteOutlineIcon sx={dangerIconSx} />
          <Typography sx={{ fontSize: 13 }}>Delete</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(renameState)} onClose={() => setRenameState(null)} fullWidth maxWidth="xs">
        <DialogTitle>{renameState?.type === 'workspace' ? 'Rename workspace' : 'Rename board'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={renameState?.value ?? ''}
            onChange={(event) => setRenameState((prev) => prev ? { ...prev, value: event.target.value } : prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveRename();
              if (event.key === 'Escape') setRenameState(null);
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameState(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveRename} disabled={!renameState?.value.trim()} sx={{ textTransform: 'none' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export { Sidebar };
