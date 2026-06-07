import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Box, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getTasks,
  type MyTaskListItem,
} from '../services/myTasksService';
import { getUserPreferences, updateMyTasksFilterMode } from '../services/userPreferencesService';
import { loadSession } from '../auth/auth';
import { useAuth } from '../auth/useAuth';
import { showAppError, showAppNotification } from '../components/shared/appNotifications';
import MyTaskActionsMenu from '../components/my-tasks/MyTaskActionsMenu';
import MyTaskBoardDetailPanel from '../components/my-tasks/MyTaskBoardDetailPanel';
import MyTasksFilterBar from '../components/my-tasks/MyTasksFilterBar';
import MyTasksInsights from '../components/my-tasks/MyTasksInsights';
import MyTasksTable from '../components/my-tasks/MyTasksTable';
import {
  DUE_DATE_FILTER_CHOICES,
  buildMyTasksSummary,
  getTaskLink,
  getWorkflowLabel,
  taskMatchesFilters,
  taskMatchesInsight,
  taskMatchesSearch,
  uniqueChoices,
} from '../components/my-tasks/myTasksUtils';
import {
  EMPTY_MY_TASKS_FILTERS,
  type InsightId,
  type MyTasksFilterMode,
  type MyTasksFilters,
  type TaskMenuState,
} from '../components/my-tasks/types';
import WorkspaceActionPillButton from '../components/workspaces/detail/WorkspaceActionPillButton';

const isMyTasksFilterMode = (value: unknown): value is MyTasksFilterMode => value === 'kpis' || value === 'filters';

function getStoredFilterMode() {
  const email = loadSession()?.email ?? 'anonymous';
  const storedMode = window.localStorage.getItem(`mytasks:${email}:filterMode`);
  return isMyTasksFilterMode(storedMode) ? storedMode : 'kpis';
}

function Issues() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, profile } = useAuth();
  const [tasks, setTasks] = useState<MyTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<MyTasksFilterMode>(() => getStoredFilterMode());
  const [selectedInsight, setSelectedInsight] = useState<InsightId | null>(null);
  const [filters, setFilters] = useState<MyTasksFilters>(EMPTY_MY_TASKS_FILTERS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<TaskMenuState>(null);
  const filterModeStorageKey = useMemo(
    () => `mytasks:${session?.email ?? 'anonymous'}:filterMode`,
    [session?.email]
  );
  const scopedWorkspaceId = searchParams.get('workspaceId');
  const scopedWorkspaceName = searchParams.get('project');
  const currentUserId = profile ? String(profile.id) : '';

  const buildDefaultFilters = useCallback((): MyTasksFilters => ({
    ...EMPTY_MY_TASKS_FILTERS,
    workspaceIds: scopedWorkspaceId ? [scopedWorkspaceId] : [],
    personIds: currentUserId ? [currentUserId] : [],
  }), [currentUserId, scopedWorkspaceId]);

  const buildClearedFilters = useCallback((): MyTasksFilters => ({
    ...EMPTY_MY_TASKS_FILTERS,
    workspaceIds: scopedWorkspaceId ? [scopedWorkspaceId] : [],
  }), [scopedWorkspaceId]);

  const loadTasks = useCallback(() => {
    let cancelled = false;
    void getTasks(scopedWorkspaceId)
      .then((response) => {
        if (!cancelled) setTasks(response.items);
      })
      .catch((error) => {
        if (!cancelled) {
          setTasks([]);
          showAppError(error, 'Failed to load tasks');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scopedWorkspaceId]);

  useEffect(() => loadTasks(), [loadTasks]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    setFilters(buildDefaultFilters());
  }, [buildDefaultFilters, currentUserId]);

  useEffect(() => {
    let cancelled = false;
    void getUserPreferences()
      .then((preferences) => {
        const savedMode = preferences.myTasks?.filterMode;
        if (!cancelled && isMyTasksFilterMode(savedMode)) {
          setFilterMode(savedMode);
          window.localStorage.setItem(filterModeStorageKey, savedMode);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [filterModeStorageKey]);

  const summary = useMemo(() => buildMyTasksSummary(tasks), [tasks]);

  const workspaceChoices = useMemo(
    () => uniqueChoices(tasks, (task) => task.workspaceId, (task) => task.workspaceName),
    [tasks]
  );

  const boardChoices = useMemo(() => {
    const scopedTasks = filters.workspaceIds.length > 0
      ? tasks.filter((task) => filters.workspaceIds.includes(task.workspaceId))
      : tasks;
    return uniqueChoices(scopedTasks, (task) => task.boardId, (task) => task.boardName, undefined, (task) => task.workspaceName);
  }, [tasks, filters.workspaceIds]);

  const personChoices = useMemo(() => {
    const map = new Map<string, { id: string; label: string; groupLabel?: string }>();
    for (const task of tasks) {
      for (const assignee of task.assignees) {
        const id = String(assignee.id);
        if (!map.has(id)) {
          map.set(id, {
            id,
            label: assignee.name,
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks]);

  const priorityChoices = useMemo(
    () => uniqueChoices(tasks, (task) => task.priority, (task) => task.priorityLabel, (task) => task.priorityColor),
    [tasks]
  );

  const statusChoices = useMemo(
    () => uniqueChoices(tasks, (task) => task.workflow, (task) => getWorkflowLabel(task.workflow)),
    [tasks]
  );

  const toggleFilter = <K extends keyof MyTasksFilters>(key: K, value: MyTasksFilters[K][number]) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(String(value))
        ? current.filter((item) => item !== String(value))
        : [...current, String(value)];

        if (key === 'workspaceIds') {
          const nextWorkspaceIds = next;
          const allowedBoardIds = new Set(
          tasks
            .filter((task) => nextWorkspaceIds.length === 0 || nextWorkspaceIds.includes(task.workspaceId))
            .map((task) => task.boardId)
        );
        return {
          ...prev,
          workspaceIds: nextWorkspaceIds,
          boardIds: prev.boardIds.filter((boardId) => allowedBoardIds.has(boardId)),
        };
      }

      return { ...prev, [key]: next };
    });
  };

  const changeFilterMode = (mode: MyTasksFilterMode) => {
    setFilterMode(mode);
    setSelectedInsight(null);
    window.localStorage.setItem(filterModeStorageKey, mode);

    if (mode === 'kpis') {
      setFilters((prev) => ({ ...prev, workflows: [], dueDates: [] }));
    }

    void updateMyTasksFilterMode(mode).catch(() => undefined);
  };

  const visibleTasks = useMemo(() => (
    tasks
      .filter((task) => filterMode === 'kpis' ? taskMatchesInsight(task, selectedInsight) : true)
      .filter((task) => taskMatchesFilters(task, filters))
      .filter((task) => taskMatchesSearch(task, searchQuery))
  ), [tasks, filterMode, selectedInsight, filters, searchQuery]);

  const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null;
  const menuTask = menuState ? tasks.find((task) => task.id === menuState.taskId) ?? null : null;

  const openTaskMenu = (event: MouseEvent<HTMLElement>, taskId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({ anchor: event.currentTarget, taskId });
  };

  const openTaskContextMenu = (event: MouseEvent<HTMLElement>, taskId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({
      taskId,
      position: {
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      },
    });
  };

  const copyTaskLink = async (task: MyTaskListItem) => {
    const url = `${window.location.origin}${getTaskLink(task)}`;
    try {
      await navigator.clipboard.writeText(url);
      showAppNotification({ message: 'Task link copied', severity: 'success' });
    } catch {
      showAppNotification({ message: url, severity: 'info' });
    }
    setMenuState(null);
  };

  const openTaskOnBoard = (task: MyTaskListItem) => {
    navigate(getTaskLink(task));
    setMenuState(null);
  };

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 4 },
        py: 4,
      }}
    >
      {scopedWorkspaceId && scopedWorkspaceName ? (
        <WorkspaceActionPillButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/workspaces/${scopedWorkspaceId}`)}
          sx={{
            mb: 3,
            fontSize: 14,
          }}
        >
          Back to {scopedWorkspaceName}
        </WorkspaceActionPillButton>
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={2.5} sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 900, color: 'text.primary', lineHeight: 1.15 }}>
            Tasks
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: 13.5, color: 'text.secondary', fontWeight: 600 }}>
            {scopedWorkspaceName
              ? `Tasks in ${scopedWorkspaceName}.`
              : 'Tasks across workspaces and boards.'}
          </Typography>
        </Box>
        <TextField
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks..."
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', md: 360 },
            '& .MuiOutlinedInput-root': {
              height: 42,
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        />
      </Stack>

      {filterMode === 'kpis' && (
        <MyTasksInsights
          summary={summary}
          selectedInsight={selectedInsight}
          onSelectInsight={setSelectedInsight}
        />
      )}

      <MyTasksFilterBar
        filters={filters}
        workspaceChoices={workspaceChoices}
        boardChoices={boardChoices}
        personChoices={personChoices}
        priorityChoices={priorityChoices}
        statusChoices={statusChoices}
        dueDateChoices={DUE_DATE_FILTER_CHOICES}
        filterMode={filterMode}
        visibleCount={visibleTasks.length}
        onToggleFilter={toggleFilter}
        onFilterModeChange={changeFilterMode}
        onClear={() => setFilters(buildClearedFilters())}
      />

      <MyTasksTable
        tasks={visibleTasks}
        isLoading={isLoading}
        onOpenTask={setSelectedTaskId}
        onOpenMenu={openTaskMenu}
        onOpenContextMenu={openTaskContextMenu}
      />

      <MyTaskActionsMenu
        state={menuState}
        task={menuTask}
        onClose={() => setMenuState(null)}
        onOpenDetails={(task) => {
          setSelectedTaskId(task.id);
          setMenuState(null);
        }}
        onOpenInBoard={openTaskOnBoard}
        onCopyLink={copyTaskLink}
      />

      <MyTaskBoardDetailPanel
        task={selectedTask}
        onClose={() => {
          setSelectedTaskId(null);
          loadTasks();
        }}
      />
    </Box>
  );
}

export default Issues;
