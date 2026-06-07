// ─── TaskBoardPage — top level layout connecting everything ───

import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  Popover,
  LinearProgress,
  Snackbar,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  OutlinedInput,
  Chip,
  CircularProgress,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { TaskBoardProvider } from './TaskBoardContext';
import { useTaskBoard } from './useTaskBoard';
import MainTableView from './table/MainTableView';
import ChartView from './chart/ChartView';
import CalendarView from './calendar/CalendarView';
import KanbanView from './kanban/KanbanView';
import TaskDetailPanel from './panel/TaskDetailPanel';
import type { BoardView } from './types';
import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent, type ReactElement } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { showAppNotification } from '../../shared/appNotifications';
import { getBoardMemberCandidates } from '../../../services/taskBoardService';
import { getWorkspace, type AssignableUser } from '../../../services/workspacesService';
import WorkspaceActionPillButton from '../detail/WorkspaceActionPillButton';

const OPTIONAL_VIEWS: Array<{ value: Exclude<BoardView, 'table'>; label: string; icon: ReactElement }> = [
  { value: 'insights', label: 'Insights', icon: <InsertChartIcon sx={{ fontSize: 18 }} /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
  { value: 'kanban', label: 'Kanban', icon: <ViewKanbanIcon sx={{ fontSize: 18 }} /> },
];

function loadVisibleViews(key: string): Exclude<BoardView, 'table'>[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter((view): view is Exclude<BoardView, 'table'> => OPTIONAL_VIEWS.some((item) => item.value === view));
  } catch {
    return [];
  }
}

// The actual content inside the provider
function TaskBoardContent() {
  const {
    boardConfig,
    activeView,
    setActiveView,
    isLoading,
    error,
    deleteNotice,
    undoTaskDelete,
    dismissDeleteNotice,
    renameBoard,
    tasks,
    openPanel,
    users,
    inviteBoardMembers,
  } = useTaskBoard();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { workspaceId: routeWorkspaceId = '', boardId: routeBoardId = '' } = useParams();
  const taskParamRef = useRef<string | null>(null);
  const hasAutoOpenedTaskRef = useRef(false);
  const { session, hasRoleAtLeast } = useAuth();
  const [addViewAnchor, setAddViewAnchor] = useState<HTMLButtonElement | null>(null);
  const [viewMenu, setViewMenu] = useState<{ mouseX: number; mouseY: number; view: Exclude<BoardView, 'table'> } | null>(null);
  const [draggedView, setDraggedView] = useState<Exclude<BoardView, 'table'> | null>(null);
  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [boardNameDraft, setBoardNameDraft] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isLoadingAssignableUsers, setIsLoadingAssignableUsers] = useState(false);
  const [selectedInviteUserIds, setSelectedInviteUserIds] = useState<number[]>([]);
  const [isInvitingMembers, setIsInvitingMembers] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  
  // Format the board title (e.g., frontend -> Frontend Design)
  const boardTitle = boardConfig.boardName || 'Task Board';
  const viewPreferenceKey = useMemo(
    () => `taskboard_visible_views_${session?.email ?? 'anonymous'}_${boardConfig.workspaceId}`,
    [session?.email, boardConfig.workspaceId]
  );
  const [visibleOptionalViews, setVisibleOptionalViews] = useState<Exclude<BoardView, 'table'>[]>(() => loadVisibleViews(viewPreferenceKey));
  const availableViews = OPTIONAL_VIEWS.filter((view) => !visibleOptionalViews.includes(view.value));
  const canRenameBoard = hasRoleAtLeast('TEAM_LEAD');
  const canInviteBoardMembers = hasRoleAtLeast('TEAM_LEAD');
  const existingUserIds = useMemo(() => new Set(Object.keys(users).map((id) => Number(id))), [users]);
  const inviteCandidates = useMemo(
    () => assignableUsers.filter((user) => !existingUserIds.has(user.id)),
    [assignableUsers, existingUserIds]
  );

  useEffect(() => {
    setVisibleOptionalViews(loadVisibleViews(viewPreferenceKey));
  }, [viewPreferenceKey]);

  useEffect(() => {
    localStorage.setItem(viewPreferenceKey, JSON.stringify(visibleOptionalViews));
  }, [viewPreferenceKey, visibleOptionalViews]);

  useEffect(() => {
    let cancelled = false;
    if (!routeWorkspaceId) return;

    void getWorkspace(routeWorkspaceId)
      .then((workspace) => {
        if (!cancelled) {
          setWorkspaceName(workspace.title);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaceName('Workspace');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeWorkspaceId]);

  useEffect(() => {
    if (activeView !== 'table' && !visibleOptionalViews.includes(activeView as Exclude<BoardView, 'table'>)) {
      setActiveView('table');
    }
  }, [activeView, visibleOptionalViews, setActiveView]);

  useEffect(() => {
    setBoardNameDraft(boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    if (error) {
      showAppNotification({ message: error, severity: 'warning' });
    }
  }, [error]);

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskParamRef.current !== taskId) {
      taskParamRef.current = taskId;
      hasAutoOpenedTaskRef.current = false;
    }
    if (!taskId || hasAutoOpenedTaskRef.current || isLoading || !tasks[taskId]) return;
    openPanel(taskId);
    hasAutoOpenedTaskRef.current = true;
  }, [searchParams, tasks, isLoading, openPanel]);

  const handleAddView = (view: Exclude<BoardView, 'table'>) => {
    setVisibleOptionalViews((prev) => [...prev, view]);
    setActiveView(view);
    setAddViewAnchor(null);
  };

  const handleOpenViewMenu = (event: MouseEvent<HTMLElement>, view: Exclude<BoardView, 'table'>) => {
    event.preventDefault();
    setViewMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, view });
  };

  const moveOptionalView = (direction: -1 | 1) => {
    if (!viewMenu) return;
    setVisibleOptionalViews((prev) => {
      const index = prev.indexOf(viewMenu.view);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setViewMenu(null);
  };

  const reorderOptionalViews = (
    sourceView: Exclude<BoardView, 'table'>,
    targetView: Exclude<BoardView, 'table'>
  ) => {
    if (sourceView === targetView) return;
    setVisibleOptionalViews((prev) => {
      const sourceIndex = prev.indexOf(sourceView);
      const targetIndex = prev.indexOf(targetView);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceView);
      return next;
    });
  };

  const handleViewDragStart = (
    event: DragEvent<HTMLElement>,
    view: Exclude<BoardView, 'table'>
  ) => {
    setDraggedView(view);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/taskboard-view', view);
  };

  const handleViewDrop = (
    event: DragEvent<HTMLElement>,
    targetView: Exclude<BoardView, 'table'>
  ) => {
    event.preventDefault();
    const sourceView = (event.dataTransfer.getData('text/taskboard-view') || draggedView) as Exclude<BoardView, 'table'> | null;
    if (sourceView && OPTIONAL_VIEWS.some((view) => view.value === sourceView)) {
      reorderOptionalViews(sourceView, targetView);
    }
    setDraggedView(null);
  };

  const removeOptionalView = () => {
    if (!viewMenu) return;
    setVisibleOptionalViews((prev) => prev.filter((view) => view !== viewMenu.view));
    if (activeView === viewMenu.view) {
      setActiveView('table');
    }
    setViewMenu(null);
  };

  const saveBoardName = () => {
    const nextName = boardNameDraft.trim();
    if (nextName && nextName !== boardTitle) {
      renameBoard(nextName);
    } else {
      setBoardNameDraft(boardTitle);
    }
    setIsRenamingBoard(false);
  };

  const openInviteDialog = () => {
    if (!canInviteBoardMembers) return;
    setInviteOpen(true);
    setSelectedInviteUserIds([]);
    if (assignableUsers.length > 0 || isLoadingAssignableUsers) return;
    setIsLoadingAssignableUsers(true);
    void getBoardMemberCandidates(routeWorkspaceId, routeBoardId)
      .then(setAssignableUsers)
      .catch((e) => {
        showAppNotification({
          message: e instanceof Error ? e.message : 'Failed to load users',
          severity: 'error',
        });
      })
      .finally(() => setIsLoadingAssignableUsers(false));
  };

  const submitInvite = async () => {
    if (!canInviteBoardMembers) return;
    if (selectedInviteUserIds.length === 0) return;
    try {
      setIsInvitingMembers(true);
      await inviteBoardMembers(selectedInviteUserIds);
      showAppNotification({
        message: selectedInviteUserIds.length === 1 ? 'Member added to board' : 'Members added to board',
        severity: 'success',
      });
      setInviteOpen(false);
      setSelectedInviteUserIds([]);
    } catch (e) {
      showAppNotification({
        message: e instanceof Error ? e.message : 'Failed to invite members',
        severity: 'error',
      });
    } finally {
      setIsInvitingMembers(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />}
      
      {/* Header */}
      <Box sx={{ px: 4, py: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <WorkspaceActionPillButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/workspaces/${routeWorkspaceId}`)}
          sx={{
            textTransform: 'none',
            mb: 2,
            fontSize: 14,
          }}
        >
          Back to {workspaceName}
        </WorkspaceActionPillButton>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isRenamingBoard ? (
              <TextField
                value={boardNameDraft}
                onChange={(event) => setBoardNameDraft(event.target.value)}
                onBlur={saveBoardName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveBoardName();
                  if (event.key === 'Escape') {
                    setBoardNameDraft(boardTitle);
                    setIsRenamingBoard(false);
                  }
                }}
                autoFocus
                variant="standard"
                InputProps={{ disableUnderline: true, sx: { fontSize: 34, fontWeight: 800, lineHeight: 1.25 } }}
              />
            ) : (
              <Typography
                variant="h4"
                onClick={() => canRenameBoard && setIsRenamingBoard(true)}
                sx={{
                  fontWeight: 700,
                  cursor: canRenameBoard ? 'text' : 'default',
                  borderRadius: 1,
                  px: canRenameBoard ? 0.5 : 0,
                  '&:hover': canRenameBoard ? { bgcolor: 'action.hover' } : undefined,
                }}
              >
                {boardTitle}
              </Typography>
            )}
          </Box>
          {canInviteBoardMembers ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PersonAddAlt1Icon />}
                onClick={openInviteDialog}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Invite / {Object.keys(users).length}
              </Button>
            </Box>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tabs
            value={activeView}
            onChange={(_, val: BoardView) => setActiveView(val)}
            sx={{ minHeight: 40 }}
          >
            <Tab 
              icon={<TableChartIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Main Table" 
              value="table" 
              sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }} 
            />
            {visibleOptionalViews.map((view) => {
              const definition = OPTIONAL_VIEWS.find((item) => item.value === view);
              if (!definition) return null;
              return (
                <Tab
                  key={definition.value}
                  icon={definition.icon}
                  iconPosition="start"
                  label={definition.label}
                  value={definition.value}
                  onContextMenu={(event) => handleOpenViewMenu(event, definition.value)}
                  onDoubleClick={(event) => handleOpenViewMenu(event, definition.value)}
                  draggable
                  onDragStart={(event) => handleViewDragStart(event, definition.value)}
                  onDragOver={(event) => {
                    if (draggedView && draggedView !== definition.value) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(event) => handleViewDrop(event, definition.value)}
                  onDragEnd={() => setDraggedView(null)}
                  sx={{
                    textTransform: 'none',
                    minHeight: 40,
                    py: 0,
                    fontWeight: 600,
                    opacity: draggedView === definition.value ? 0.45 : 1,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                  }}
                />
              );
            })}
          </Tabs>

          <IconButton
            size="small"
            onClick={(e) => setAddViewAnchor(e.currentTarget)}
            sx={{
              ml: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              width: 32,
              height: 32,
              bgcolor: 'background.paper',
            }}
            title="Add New View"
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <Popover
            open={Boolean(addViewAnchor)}
            anchorEl={addViewAnchor}
            onClose={() => setAddViewAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, p: 2, borderRadius: 2, minWidth: 200 } } }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
              Add View
            </Typography>
            {availableViews.map((view) => (
              <MenuItem key={view.value} onClick={() => handleAddView(view.value)} sx={{ gap: 1, borderRadius: 1 }}>
                {view.icon}
                {view.label}
              </MenuItem>
            ))}
            {availableViews.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>
                All views are already visible.
              </Typography>
            )}
          </Popover>

          <Menu
            open={Boolean(viewMenu)}
            onClose={() => setViewMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={viewMenu ? { top: viewMenu.mouseY, left: viewMenu.mouseX } : undefined}
            slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2, py: 0.5 } } }}
          >
            <MenuItem onClick={() => moveOptionalView(-1)} disabled={!viewMenu || visibleOptionalViews.indexOf(viewMenu.view) === 0}>
              <KeyboardArrowLeftIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13 }}>Move left</Typography>
            </MenuItem>
            <MenuItem onClick={() => moveOptionalView(1)} disabled={!viewMenu || visibleOptionalViews.indexOf(viewMenu.view) === visibleOptionalViews.length - 1}>
              <KeyboardArrowRightIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 13 }}>Move right</Typography>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={removeOptionalView} sx={{ color: 'error.main' }}>
              <RemoveCircleOutlineIcon sx={{ fontSize: 18, mr: 1.25 }} />
              <Typography sx={{ fontSize: 13 }}>Remove from bar</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Box>


      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: activeView === 'table' ? 4 : 2, py: activeView === 'table' ? 0 : 2 }}>
        {/* We keep all views mounted (or just table) to preserve scroll if desired, 
            but standard is conditional rendering. Let's do conditional rendering for now 
            except for Table which might be heavy to re-mount. */}
        <Box sx={{ display: activeView === 'table' ? 'block' : 'none', height: '100%' }}>
          <MainTableView />
        </Box>
        
        {activeView === 'insights' && <ChartView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'kanban' && <KanbanView />}
      </Box>

      {/* Slide-in Panel */}
      <TaskDetailPanel />
      <Dialog open={canInviteBoardMembers && inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Invite to board</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Select
            multiple
            fullWidth
            value={selectedInviteUserIds}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedInviteUserIds(
                (Array.isArray(value) ? value : String(value).split(',')).filter(Boolean).map(Number)
              );
            }}
            input={<OutlinedInput />}
            disabled={isLoadingAssignableUsers || isInvitingMembers}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[]).map((id) => {
                  const user = assignableUsers.find((item) => item.id === id);
                  return <Chip key={id} size="small" label={user?.name ?? `#${id}`} />;
                })}
              </Box>
            )}
            sx={{ '& .MuiSelect-select': { minHeight: 34 } }}
          >
            {isLoadingAssignableUsers && (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Loading users
              </MenuItem>
            )}
            {!isLoadingAssignableUsers && inviteCandidates.length === 0 && (
              <MenuItem disabled>All assignable users are already in this workspace.</MenuItem>
            )}
            {inviteCandidates.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{user.name}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{user.email}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitInvite}
            disabled={selectedInviteUserIds.length === 0 || isInvitingMembers}
            sx={{ textTransform: 'none' }}
          >
            {isInvitingMembers ? 'Inviting...' : 'Add to board'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(deleteNotice)}
        autoHideDuration={6000}
        onClose={dismissDeleteNotice}
        message={deleteNotice ? `Deleted ${deleteNotice.type} "${deleteNotice.label}"` : ''}
        action={
          <Button size="small" onClick={undoTaskDelete} sx={{ color: 'common.white', fontWeight: 700 }}>
            Undo
          </Button>
        }
      />
    </Box>
  );
}

// Wrapper to provide Context
export default function TaskBoardPage() {
  const { workspaceId = 'magenta', boardId = 'frontend' } = useParams();

  return (
    <Box sx={{ flex: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <TaskBoardProvider workspaceId={workspaceId} boardId={boardId}>
        <TaskBoardContent />
      </TaskBoardProvider>
    </Box>
  );
}
