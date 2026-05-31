// ─── TaskBoardPage — top level layout connecting everything ───

import { Alert, Box, Typography, Button, Tabs, Tab, IconButton, Popover, LinearProgress, Snackbar, MenuItem, TextField } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AddIcon from '@mui/icons-material/Add';
import { useParams, useSearchParams } from 'react-router-dom';

import { TaskBoardProvider } from './TaskBoardContext';
import { useTaskBoard } from './useTaskBoard';
import MainTableView from './table/MainTableView';
import ChartView from './chart/ChartView';
import CalendarView from './calendar/CalendarView';
import KanbanView from './kanban/KanbanView';
import TaskDetailPanel from './panel/TaskDetailPanel';
import type { BoardView } from './types';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { useAuth } from '../../../auth/useAuth';

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
  } = useTaskBoard();
  const [searchParams] = useSearchParams();
  const taskParamRef = useRef<string | null>(null);
  const hasAutoOpenedTaskRef = useRef(false);
  const { session, hasRoleAtLeast } = useAuth();
  const [addViewAnchor, setAddViewAnchor] = useState<HTMLButtonElement | null>(null);
  const [viewMenu, setViewMenu] = useState<{ anchor: HTMLElement; view: Exclude<BoardView, 'table'> } | null>(null);
  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [boardNameDraft, setBoardNameDraft] = useState('');
  
  // Format the board title (e.g., frontend -> Frontend Design)
  const boardTitle = boardConfig.boardName || 'Task Board';
  const viewPreferenceKey = useMemo(
    () => `taskboard_visible_views_${session?.email ?? 'anonymous'}_${boardConfig.workspaceId}`,
    [session?.email, boardConfig.workspaceId]
  );
  const [visibleOptionalViews, setVisibleOptionalViews] = useState<Exclude<BoardView, 'table'>[]>(() => loadVisibleViews(viewPreferenceKey));
  const availableViews = OPTIONAL_VIEWS.filter((view) => !visibleOptionalViews.includes(view.value));
  const canRenameBoard = hasRoleAtLeast('TEAM_LEAD');

  useEffect(() => {
    setVisibleOptionalViews(loadVisibleViews(viewPreferenceKey));
  }, [viewPreferenceKey]);

  useEffect(() => {
    localStorage.setItem(viewPreferenceKey, JSON.stringify(visibleOptionalViews));
  }, [viewPreferenceKey, visibleOptionalViews]);

  useEffect(() => {
    if (activeView !== 'table' && !visibleOptionalViews.includes(activeView as Exclude<BoardView, 'table'>)) {
      setActiveView('table');
    }
  }, [activeView, visibleOptionalViews, setActiveView]);

  useEffect(() => {
    setBoardNameDraft(boardTitle);
  }, [boardTitle]);

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
    setViewMenu({ anchor: event.currentTarget, view });
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />}
      
      {/* Header */}
      <Box sx={{ px: 4, py: 3, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PersonAddAlt1Icon />}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Invite / 1
            </Button>
          </Box>
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
                  sx={{ textTransform: 'none', minHeight: 40, py: 0, fontWeight: 600 }}
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

          <Popover
            open={Boolean(viewMenu)}
            anchorEl={viewMenu?.anchor ?? null}
            onClose={() => setViewMenu(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, p: 0.75, borderRadius: 2, minWidth: 180 } } }}
          >
            <MenuItem onClick={() => moveOptionalView(-1)} disabled={!viewMenu || visibleOptionalViews.indexOf(viewMenu.view) === 0}>
              Move left
            </MenuItem>
            <MenuItem onClick={() => moveOptionalView(1)} disabled={!viewMenu || visibleOptionalViews.indexOf(viewMenu.view) === visibleOptionalViews.length - 1}>
              Move right
            </MenuItem>
            <MenuItem onClick={removeOptionalView} sx={{ color: 'error.main' }}>
              Remove from bar
            </MenuItem>
          </Popover>
        </Box>
      </Box>


      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: activeView === 'table' ? 4 : 2, py: activeView === 'table' ? 0 : 2 }}>
        {error && (
          <Alert severity="warning" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
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
      <Snackbar
        open={Boolean(deleteNotice)}
        autoHideDuration={6000}
        onClose={dismissDeleteNotice}
        message={deleteNotice ? `Deleted "${deleteNotice.taskName}"` : ''}
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
