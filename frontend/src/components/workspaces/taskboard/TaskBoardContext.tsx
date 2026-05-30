// ─── Task Board Context (Section 8/17 of spec) ───
// Single source of truth for all Task Board state.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  BoardConfig,
  BoardView,
  ColumnDefinition,
  PanelState,
  SelectOption,
  Task,
  TaskGroup,
  TaskBoardState,
} from './types';
import { getMockWorkspaceBoards, getMockWorkspaceData, getMockUsers } from '../../../mocks/taskBoard';
import {
  createColumn as createColumnRequest,
  createTask as createTaskRequest,
  createTaskGroup,
  createTaskUpdate,
  deleteTask as deleteTaskRequest,
  getTaskBoard,
  patchTask,
  type BoardMoveTarget,
} from '../../../services/taskBoardService';

// ─── Context value (state + actions) ───
interface TaskBoardContextValue extends Omit<TaskBoardState, 'manualGroupOrder'> {
  manualGroupOrder: string[];
  availableBoards: BoardMoveTarget[];
  isLoading: boolean;
  error: string | null;

  // View
  setActiveView: (view: BoardView) => void;

  // Panel
  openPanel: (taskId: string) => void;
  closePanel: () => void;
  setPanelTab: (tab: PanelState['activeTab']) => void;

  // Groups
  toggleGroupCollapse: (groupId: string) => void;

  // Tasks — mutations
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  postTaskUpdate: (taskId: string, content: string, attachments: Task['files'], mentions: string[]) => void;
  addTask: (task: Task) => void;
  addTaskToFirstGroup: () => void;
  moveTask: (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => void;
  moveTaskToGroup: (taskId: string, toGroupId: string) => void;
  moveTaskToBoardGroup: (taskId: string, toBoardId: string, toGroupId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Column management
  updateColumns: (columns: ColumnDefinition[]) => void;
  addColumn: (col: ColumnDefinition) => void;
  updateStatusOptions: (options: SelectOption[]) => void;
  updatePriorityOptions: (options: SelectOption[]) => void;

  // Groups — mutations
  reorderGroups: (newGroups: TaskGroup[]) => void;
  addGroupAtSecondPosition: () => void;
  updateGroupColor: (groupId: string, color: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveGroupToBoard: (groupId: string, toBoardId: string) => void;
  deleteGroup: (groupId: string) => void;

  // Search & Sorting UI
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: 'none' | 'taskCount' | 'alphabetical';
  setSortMode: (mode: 'none' | 'taskCount' | 'alphabetical') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;

  // Computed groups (filtered & sorted)
  visibleGroups: TaskGroup[];

  // Completion tracking (local only)
  completedTasks: Set<string>;
}

const TaskBoardContext = createContext<TaskBoardContextValue | null>(null);

// ─── localStorage helpers (Section 18 of spec) ───
const STORAGE_VERSION = 2;

interface StoredBoardState {
  version: number;
  config: BoardConfig;
  groups: TaskGroup[];
  tasks: Record<string, Task>;
  manualGroupOrder: string[];
}

function loadBoardState(boardId: string, fallback: ReturnType<typeof getMockWorkspaceData>): StoredBoardState | null {
  try {
    const raw = localStorage.getItem(`task_board_state_${boardId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredBoardState;
      if (parsed.version !== STORAGE_VERSION) {
        localStorage.removeItem(`task_board_state_${boardId}`);
        return null;
      }
      // Ensure each task has assigneeIds array for backwards compatibility
      if (parsed.tasks) {
        Object.keys(parsed.tasks).forEach((id) => {
          const task = parsed.tasks[id];
          if (!task.assigneeIds) {
            task.assigneeIds = task.assigneeId ? [task.assigneeId] : [];
          }
        });
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load board state', e);
  }

  if (!fallback) return null;

  // Process fallback mock data
  const groups = fallback.groups;
  const tasks = { ...fallback.tasks };
  Object.keys(tasks).forEach((id) => {
    const task = tasks[id];
    if (!task.assigneeIds) {
      task.assigneeIds = task.assigneeId ? [task.assigneeId] : [];
    }
  });

  const manualGroupOrder = groups.map((g) => g.id);

  return {
    version: 1,
    config: fallback.config,
    groups,
    tasks,
    manualGroupOrder,
  };
}

function saveBoardState(boardId: string, state: Omit<StoredBoardState, 'version'>) {
  try {
    localStorage.setItem(`task_board_state_${boardId}`, JSON.stringify({
      version: STORAGE_VERSION,
      ...state,
    }));
  } catch (e) {
    console.error('Failed to save board state', e);
  }
}

function buildBoardState(boardId: string): StoredBoardState | null {
  return loadBoardState(boardId, getMockWorkspaceData(boardId));
}

function cloneTaskRecord(tasks: Record<string, Task>): Record<string, Task> {
  return Object.fromEntries(
    Object.entries(tasks).map(([taskId, task]) => [taskId, { ...task, files: [...task.files], updates: [...task.updates] }])
  );
}

// ─── Provider ───
interface TaskBoardProviderProps {
  workspaceId: string;
  boardId: string;
  children: ReactNode;
}

export function TaskBoardProvider({ workspaceId, boardId, children }: TaskBoardProviderProps) {
  const storageBoardId = `${workspaceId}_${boardId}`;
  const workspaceRootId = workspaceId;

  // ─── Base States ───
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(() => {
    const fallback = getMockWorkspaceData(storageBoardId);
    const loaded = loadBoardState(storageBoardId, fallback);
    return loaded?.config ?? { workspaceId: boardId, columns: [], statusOptions: [], priorityOptions: [] };
  });

  const [groups, setGroups] = useState<TaskGroup[]>(() => {
    const fallback = getMockWorkspaceData(storageBoardId);
    const loaded = loadBoardState(storageBoardId, fallback);
    return loaded?.groups ?? [];
  });

  const [tasks, setTasks] = useState<Record<string, Task>>(() => {
    const fallback = getMockWorkspaceData(storageBoardId);
    const loaded = loadBoardState(storageBoardId, fallback);
    return loaded?.tasks ?? {};
  });

  const [manualGroupOrder, setManualGroupOrder] = useState<string[]>(() => {
    const fallback = getMockWorkspaceData(storageBoardId);
    const loaded = loadBoardState(storageBoardId, fallback);
    return loaded?.manualGroupOrder ?? [];
  });

  const [users, setUsers] = useState<Record<string, TaskBoardState['users'][string]>>(() => getMockUsers());
  const [availableBoards, setAvailableBoards] = useState<BoardMoveTarget[]>(() => (
    getMockWorkspaceBoards(workspaceRootId).map((board) => {
      const stored = buildBoardState(board.id);
      return {
        id: board.id,
        name: stored?.config.boardName ?? board.name,
        groups: stored?.groups ?? board.groups,
      };
    })
  ));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeView, setActiveView] = useState<BoardView>('table');
  const [panel, setPanel] = useState<PanelState>({
    isOpen: false,
    taskId: null,
    activeTab: 'updates',
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Live filter & sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'none' | 'taskCount' | 'alphabetical'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Re-init state when workspace/board ID changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fallback = getMockWorkspaceData(storageBoardId);
    const loaded = loadBoardState(storageBoardId, fallback);
    setBoardConfig(loaded?.config ?? { workspaceId: boardId, columns: [], statusOptions: [], priorityOptions: [] });
    setGroups(loaded?.groups ?? []);
    setTasks(loaded?.tasks ?? {});
    setManualGroupOrder(loaded?.manualGroupOrder ?? []);
    setUsers(getMockUsers());
    setAvailableBoards(getMockWorkspaceBoards(workspaceRootId).map((board) => {
      const stored = buildBoardState(board.id);
      return {
        id: board.id,
        name: stored?.config.boardName ?? board.name,
        groups: stored?.groups ?? board.groups,
      };
    }));

    setPanel({ isOpen: false, taskId: null, activeTab: 'updates' });
    setCollapsedGroups(new Set());
    setCompletedTasks(new Set());
    setSearchQuery('');
    setSortMode('none');
    setSortDirection('desc');

    void getTaskBoard(workspaceId, boardId)
      .then((payload) => {
        if (cancelled) return;
        setBoardConfig(payload.boardConfig);
        setGroups(payload.groups);
        setTasks(payload.tasks);
        setUsers(payload.users);
        setManualGroupOrder(payload.groups.map((g) => g.id));
        setAvailableBoards(payload.availableBoards);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load task board');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, boardId, storageBoardId, workspaceRootId]);

  // Sync to localStorage helper
  const syncStorage = useCallback((
    updatedConfig: BoardConfig,
    updatedGroups: TaskGroup[],
    updatedTasks: Record<string, Task>,
    updatedOrder: string[]
  ) => {
    saveBoardState(storageBoardId, {
      config: updatedConfig,
      groups: updatedGroups,
      tasks: updatedTasks,
      manualGroupOrder: updatedOrder,
    });
  }, [storageBoardId]);

  // ─── Actions ───
  const openPanel = useCallback((taskId: string) => {
    setPanel({ isOpen: true, taskId, activeTab: 'updates' });
  }, []);

  const closePanel = useCallback(() => {
    setPanel((prev) => ({ ...prev, isOpen: false, taskId: null }));
  }, []);

  const setPanelTab = useCallback((tab: PanelState['activeTab']) => {
    setPanel((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const updateTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => {
      const existing = prev[taskId];
      if (!existing) return prev;
      const updated = {
        ...prev,
        [taskId]: {
          ...existing,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
      // Keep assigneeId in sync with the first item in assigneeIds for safety/legacy components
      if (patch.assigneeIds !== undefined) {
        updated[taskId].assigneeId = patch.assigneeIds.length > 0 ? patch.assigneeIds[0] : null;
      }
      syncStorage(boardConfig, groups, updated, manualGroupOrder);
      return updated;
    });
    void patchTask(workspaceId, boardId, taskId, patch).catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to update task');
    });
  }, [workspaceId, boardId, boardConfig, groups, manualGroupOrder, syncStorage]);

  const postTaskUpdate = useCallback((taskId: string, content: string, attachments: Task['files'], mentions: string[]) => {
    const existing = tasks[taskId];
    if (!existing) return;

    const activeUser = Object.values(users)[0];
    const optimisticUpdate = {
      id: `upd_${Date.now()}`,
      taskId,
      authorId: activeUser?.id ?? '',
      content,
      createdAt: new Date().toISOString(),
      attachments,
      mentions,
    };
    updateTask(taskId, {
      updates: [...(existing.updates || []), optimisticUpdate],
      files: [...(existing.files || []), ...attachments],
    });
    void createTaskUpdate(workspaceId, boardId, taskId, { content, attachments, mentions })
      .then(() => {
        void getTaskBoard(workspaceId, boardId).then((payload) => {
          setBoardConfig(payload.boardConfig);
          setGroups(payload.groups);
          setTasks(payload.tasks);
          setUsers(payload.users);
          setManualGroupOrder(payload.groups.map((g) => g.id));
          setAvailableBoards(payload.availableBoards);
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create update'));
  }, [workspaceId, boardId, tasks, users, updateTask]);

  const addTask = useCallback((task: Task) => {
    const updatedTasks = { ...tasks, [task.id]: task };
    const updatedGroups = groups.map((g) =>
      g.id === task.groupId ? { ...g, taskIds: [...g.taskIds, task.id] } : g
    );

    setTasks(updatedTasks);
    setGroups(updatedGroups);
    syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
    void createTaskRequest(workspaceId, boardId, task.groupId, { name: task.name })
      .then((created) => {
        setTasks((prev) => {
          const { [task.id]:, ...rest } = prev;
          return { ...rest, [created.id]: created };
        });
        setGroups((prev) => prev.map((g) => (
          g.id === task.groupId
            ? { ...g, taskIds: g.taskIds.map((id) => (id === task.id ? created.id : id)) }
            : g
        )));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create task'));
  }, [workspaceId, boardId, tasks, groups, boardConfig, manualGroupOrder, syncStorage]);

  // Computed visibleGroups selector
  const visibleGroups = useMemo(() => {
    const groupsMap = new Map(groups.map((g) => [g.id, g]));

    // Arrange in manual order
    let orderedGroups = manualGroupOrder
      .map((id) => groupsMap.get(id))
      .filter((g): g is TaskGroup => g !== undefined);

    // Fallback if some groups are not yet in manualGroupOrder
    const orderedIds = new Set(orderedGroups.map((g) => g.id));
    groups.forEach((g) => {
      if (!orderedIds.has(g.id)) {
        orderedGroups.push(g);
      }
    });

    // Apply Live Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      orderedGroups = orderedGroups
        .map((g) => {
          const groupMatches = g.name.toLowerCase().includes(query);
          const filteredTaskIds = g.taskIds.filter((taskId) => {
            const t = tasks[taskId];
            if (!t) return false;

            const titleMatches = t.name.toLowerCase().includes(query);

            const assigneeMatches = t.assigneeIds.some((uid) => {
              const u = users[uid];
              return u && u.name.toLowerCase().includes(query);
            });

            const statusOpt = boardConfig.statusOptions.find((o) => o.id === t.status);
            const statusMatches = statusOpt && statusOpt.label.toLowerCase().includes(query);

            const priorityOpt = boardConfig.priorityOptions.find((o) => o.id === t.priority);
            const priorityMatches = priorityOpt && priorityOpt.label.toLowerCase().includes(query);

            return groupMatches || titleMatches || assigneeMatches || statusMatches || priorityMatches;
          });

          return {
            ...g,
            taskIds: filteredTaskIds,
          };
        })
        .filter((g) => g.taskIds.length > 0 || g.name.toLowerCase().includes(query));
    }

    // Apply Temporary Group-Level Sorting
    if (sortMode === 'none') {
      return orderedGroups;
    }

    const sorted = [...orderedGroups];
    if (sortMode === 'taskCount') {
      sorted.sort((a, b) => {
        const diff = a.taskIds.length - b.taskIds.length;
        return sortDirection === 'asc' ? diff : -diff;
      });
    } else if (sortMode === 'alphabetical') {
      sorted.sort((a, b) => {
        const diff = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? diff : -diff;
      });
    }

    return sorted;
  }, [groups, manualGroupOrder, tasks, users, boardConfig, searchQuery, sortMode, sortDirection]);

  // Insert a task into the first visible group in the board
  const addTaskToFirstGroup = useCallback(() => {
    const activeGroups = visibleGroups;
    if (activeGroups.length === 0) return;
    const targetGroup = activeGroups[0];

    const newTaskId = `task_${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      name: 'New Task',
      groupId: targetGroup.id,
      workspaceId: boardId,
      assigneeId: null,
      assigneeIds: [],
      status: boardConfig.statusOptions[0]?.id || '',
      priority: boardConfig.priorityOptions[0]?.id || '',
      dueDate: null,
      progress: 0,
      budget: null,
      files: [],
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = { ...tasks, [newTaskId]: newTask };
    const updatedGroups = groups.map((g) =>
      g.id === targetGroup.id ? { ...g, taskIds: [...g.taskIds, newTaskId] } : g
    );

    setTasks(updatedTasks);
    setGroups(updatedGroups);
    syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
  }, [visibleGroups, boardId, boardConfig, tasks, groups, manualGroupOrder, syncStorage]);

  // Insert an empty group in the second position of the board
  const addGroupAtSecondPosition = useCallback(() => {
    const newGroupId = `group_${Date.now()}`;
    const newGroup: TaskGroup = {
      id: newGroupId,
      workspaceId: boardId,
      name: 'New Group',
      color: '#A3334D', // default Burgundy color
      order: groups.length,
      taskIds: [],
    };

    const updatedGroups = [...groups, newGroup];

    // Determine second manual index (index 1)
    const updatedOrder = [...manualGroupOrder];
    if (updatedOrder.length === 0) {
      updatedOrder.push(newGroupId);
    } else {
      updatedOrder.splice(1, 0, newGroupId);
    }

    setGroups(updatedGroups);
    setManualGroupOrder(updatedOrder);
    syncStorage(boardConfig, updatedGroups, tasks, updatedOrder);
    void createTaskGroup(workspaceId, boardId, { name: newGroup.name, color: newGroup.color })
      .then((created) => {
        setGroups((prev) => prev.map((g) => (g.id === newGroupId ? { ...created, taskIds: [] } : g)));
        setManualGroupOrder((prev) => prev.map((id) => (id === newGroupId ? created.id : id)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create group'));
  }, [workspaceId, boardId, groups, manualGroupOrder, tasks, boardConfig, syncStorage]);

  const moveTask = useCallback(
    (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => {
      const updatedGroups = groups.map((g) => {
        if (g.id === fromGroupId) {
          return { ...g, taskIds: g.taskIds.filter((id) => id !== taskId) };
        }
        if (g.id === toGroupId) {
          const ids = g.taskIds.filter((id) => id !== taskId);
          ids.splice(newIndex, 0, taskId);
          return { ...g, taskIds: ids };
        }
        return g;
      });

      const updatedTasks = {
        ...tasks,
        [taskId]: {
          ...tasks[taskId],
          groupId: toGroupId,
          updatedAt: new Date().toISOString(),
        },
      };

      setGroups(updatedGroups);
      setTasks(updatedTasks);
      syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
    },
    [groups, tasks, boardConfig, manualGroupOrder, syncStorage]
  );

  const moveTaskToGroup = useCallback(
    (taskId: string, toGroupId: string) => {
      const task = tasks[taskId];
      if (!task || task.groupId === toGroupId) return;

      const updatedGroups = groups.map((g) => {
        if (g.id === task.groupId) {
          return { ...g, taskIds: g.taskIds.filter((id) => id !== taskId) };
        }
        if (g.id === toGroupId) {
          return { ...g, taskIds: [...g.taskIds.filter((id) => id !== taskId), taskId] };
        }
        return g;
      });

      const updatedTasks = {
        ...tasks,
        [taskId]: {
          ...task,
          groupId: toGroupId,
          updatedAt: new Date().toISOString(),
        },
      };

      setGroups(updatedGroups);
      setTasks(updatedTasks);
      syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
    },
    [tasks, groups, boardConfig, manualGroupOrder, syncStorage]
  );

  const moveTaskToBoardGroup = useCallback(
    (taskId: string, toBoardId: string, toGroupId: string) => {
      if (toBoardId === boardId) {
        moveTaskToGroup(taskId, toGroupId);
        return;
      }

      const task = tasks[taskId];
      const targetState = buildBoardState(toBoardId);
      if (!task || !targetState || !targetState.groups.some((g) => g.id === toGroupId)) return;

      const targetTasks = cloneTaskRecord(targetState.tasks);
      const nextTaskId = targetTasks[taskId] ? `${taskId}_${Date.now()}` : taskId;
      const movedTask: Task = {
        ...task,
        id: nextTaskId,
        groupId: toGroupId,
        workspaceId: toBoardId,
        updatedAt: new Date().toISOString(),
      };

      const updatedTargetTasks = {
        ...targetTasks,
        [nextTaskId]: movedTask,
      };
      const updatedTargetGroups = targetState.groups.map((g) =>
        g.id === toGroupId ? { ...g, taskIds: [...g.taskIds, nextTaskId] } : g
      );

      const { [taskId]: _deletedTask, ...updatedCurrentTasks } = tasks;
      const updatedCurrentGroups = groups.map((g) => ({
        ...g,
        taskIds: g.taskIds.filter((id) => id !== taskId),
      }));

      setTasks(updatedCurrentTasks);
      setGroups(updatedCurrentGroups);
      setPanel((prev) => (prev.taskId === taskId ? { isOpen: false, taskId: null, activeTab: 'updates' } : prev));
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      saveBoardState(toBoardId, {
        config: targetState.config,
        groups: updatedTargetGroups,
        tasks: updatedTargetTasks,
        manualGroupOrder: targetState.manualGroupOrder,
      });
      syncStorage(boardConfig, updatedCurrentGroups, updatedCurrentTasks, manualGroupOrder);
    },
    [boardId, moveTaskToGroup, tasks, groups, boardConfig, manualGroupOrder, syncStorage]
  );

  const toggleTaskComplete = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const deleteTask = useCallback(
    (taskId: string) => {
      const { [taskId]: _deletedTask, ...updatedTasks } = tasks;
      const updatedGroups = groups.map((g) => ({
        ...g,
        taskIds: g.taskIds.filter((id) => id !== taskId),
      }));

      setTasks(updatedTasks);
      setGroups(updatedGroups);
      setPanel((prev) => (prev.taskId === taskId ? { isOpen: false, taskId: null, activeTab: 'updates' } : prev));
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
      void deleteTaskRequest(workspaceId, boardId, taskId).catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to delete task');
      });
    },
    [workspaceId, boardId, tasks, groups, boardConfig, manualGroupOrder, syncStorage]
  );

  const updateColumns = useCallback(
    (columns: ColumnDefinition[]) => {
      const updatedConfig = { ...boardConfig, columns };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
    },
    [boardConfig, groups, tasks, manualGroupOrder, syncStorage]
  );

  const addColumn = useCallback(
    (col: ColumnDefinition) => {
      const updatedColumnsList = [...boardConfig.columns, col];
      const updatedConfig = { ...boardConfig, columns: updatedColumnsList };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
      void createColumnRequest(workspaceId, boardId, col)
        .then((created) => {
          setBoardConfig((prev) => ({
            ...prev,
            columns: prev.columns.map((c) => (c.id === col.id ? created : c)),
          }));
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create column'));
    },
    [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage]
  );

  const reorderGroups = useCallback(
    (newGroups: TaskGroup[]) => {
      const updatedOrder = newGroups.map((g) => g.id);
      setManualGroupOrder(updatedOrder);
      syncStorage(boardConfig, groups, tasks, updatedOrder);
    },
    [boardConfig, groups, tasks, syncStorage]
  );

  const updateGroupColor = useCallback(
    (groupId: string, color: string) => {
      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, color } : g
      );
      setGroups(updatedGroups);
      syncStorage(boardConfig, updatedGroups, tasks, manualGroupOrder);
    },
    [groups, boardConfig, tasks, manualGroupOrder, syncStorage]
  );

  const updateGroupName = useCallback(
    (groupId: string, name: string) => {
      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      );
      setGroups(updatedGroups);
      syncStorage(boardConfig, updatedGroups, tasks, manualGroupOrder);
    },
    [groups, boardConfig, tasks, manualGroupOrder, syncStorage]
  );

  const moveGroupToBoard = useCallback(
    (groupId: string, toBoardId: string) => {
      if (toBoardId === boardId) return;

      const groupToMove = groups.find((g) => g.id === groupId);
      const targetState = buildBoardState(toBoardId);
      if (!groupToMove || !targetState) return;

      const movedTaskIds = groupToMove.taskIds.filter((taskId) => tasks[taskId]);
      const targetTasks = cloneTaskRecord(targetState.tasks);
      const taskIdMap = new Map<string, string>();

      movedTaskIds.forEach((taskId) => {
        const nextTaskId = targetTasks[taskId] ? `${taskId}_${Date.now()}` : taskId;
        taskIdMap.set(taskId, nextTaskId);
        targetTasks[nextTaskId] = {
          ...tasks[taskId],
          id: nextTaskId,
          workspaceId: toBoardId,
          updatedAt: new Date().toISOString(),
        };
      });

      const nextGroupId = targetState.groups.some((g) => g.id === groupId)
        ? `${groupId}_${Date.now()}`
        : groupId;
      const movedGroup: TaskGroup = {
        ...groupToMove,
        id: nextGroupId,
        workspaceId: toBoardId,
        order: targetState.groups.length,
        taskIds: movedTaskIds.map((taskId) => taskIdMap.get(taskId) ?? taskId),
      };

      movedGroup.taskIds.forEach((taskId) => {
        targetTasks[taskId] = {
          ...targetTasks[taskId],
          groupId: movedGroup.id,
        };
      });

      const updatedTargetGroups = [...targetState.groups, movedGroup];
      const updatedTargetOrder = [...targetState.manualGroupOrder, movedGroup.id];
      const movedTaskIdSet = new Set(movedTaskIds);
      const updatedCurrentGroups = groups.filter((g) => g.id !== groupId);
      const updatedCurrentOrder = manualGroupOrder.filter((id) => id !== groupId);
      const updatedCurrentTasks = Object.fromEntries(
        Object.entries(tasks).filter(([taskId]) => !movedTaskIdSet.has(taskId))
      );

      setGroups(updatedCurrentGroups);
      setManualGroupOrder(updatedCurrentOrder);
      setTasks(updatedCurrentTasks);
      setPanel((prev) => (
        prev.taskId && movedTaskIdSet.has(prev.taskId)
          ? { isOpen: false, taskId: null, activeTab: 'updates' }
          : prev
      ));
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        movedTaskIdSet.forEach((taskId) => next.delete(taskId));
        return next;
      });

      saveBoardState(toBoardId, {
        config: targetState.config,
        groups: updatedTargetGroups,
        tasks: targetTasks,
        manualGroupOrder: updatedTargetOrder,
      });
      syncStorage(boardConfig, updatedCurrentGroups, updatedCurrentTasks, updatedCurrentOrder);
    },
    [boardId, groups, manualGroupOrder, tasks, boardConfig, syncStorage]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      const groupToDelete = groups.find((g) => g.id === groupId);
      if (!groupToDelete) return;

      const taskIdsToDelete = new Set(groupToDelete.taskIds);
      const updatedGroups = groups.filter((g) => g.id !== groupId);
      const updatedOrder = manualGroupOrder.filter((id) => id !== groupId);
      const updatedTasks = Object.fromEntries(
        Object.entries(tasks).filter(([taskId]) => !taskIdsToDelete.has(taskId))
      );

      setGroups(updatedGroups);
      setManualGroupOrder(updatedOrder);
      setTasks(updatedTasks);
      setPanel((prev) => (
        prev.taskId && taskIdsToDelete.has(prev.taskId)
          ? { isOpen: false, taskId: null, activeTab: 'updates' }
          : prev
      ));
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        taskIdsToDelete.forEach((taskId) => next.delete(taskId));
        return next;
      });
      syncStorage(boardConfig, updatedGroups, updatedTasks, updatedOrder);
    },
    [groups, manualGroupOrder, tasks, boardConfig, syncStorage]
  );

  const updateStatusOptions = useCallback(
    (statusOptions: SelectOption[]) => {
      const updatedConfig = { ...boardConfig, statusOptions };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
    },
    [boardConfig, groups, tasks, manualGroupOrder, syncStorage]
  );

  const updatePriorityOptions = useCallback(
    (priorityOptions: SelectOption[]) => {
      const updatedConfig = { ...boardConfig, priorityOptions };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
    },
    [boardConfig, groups, tasks, manualGroupOrder, syncStorage]
  );

  // ─── Memoized Context Value ───
  const value = useMemo<TaskBoardContextValue>(
    () => ({
      boardConfig,
      groups,
      tasks,
      users,
      availableBoards,
      isLoading,
      error,
      panel,
      activeView,
      collapsedGroups,
      completedTasks,
      manualGroupOrder,
      searchQuery,
      setSearchQuery,
      sortMode,
      setSortMode,
      sortDirection,
      setSortDirection,
      visibleGroups,
      setActiveView,
      openPanel,
      closePanel,
      setPanelTab,
      toggleGroupCollapse,
      updateTask,
      postTaskUpdate,
      addTask,
      addTaskToFirstGroup,
      moveTask,
      moveTaskToGroup,
      moveTaskToBoardGroup,
      toggleTaskComplete,
      deleteTask,
      updateColumns,
      addColumn,
      reorderGroups,
      addGroupAtSecondPosition,
      updateGroupColor,
      updateGroupName,
      moveGroupToBoard,
      deleteGroup,
      updateStatusOptions,
      updatePriorityOptions,
    }),
    [
      boardConfig,
      groups,
      tasks,
      users,
      availableBoards,
      isLoading,
      error,
      panel,
      activeView,
      collapsedGroups,
      completedTasks,
      manualGroupOrder,
      searchQuery,
      sortMode,
      sortDirection,
      visibleGroups,
      setActiveView,
      openPanel,
      closePanel,
      setPanelTab,
      toggleGroupCollapse,
      updateTask,
      postTaskUpdate,
      addTask,
      addTaskToFirstGroup,
      moveTask,
      moveTaskToGroup,
      moveTaskToBoardGroup,
      toggleTaskComplete,
      deleteTask,
      updateColumns,
      addColumn,
      reorderGroups,
      addGroupAtSecondPosition,
      updateGroupColor,
      updateGroupName,
      moveGroupToBoard,
      deleteGroup,
      updateStatusOptions,
      updatePriorityOptions,
    ]
  );

  return (
    <TaskBoardContext.Provider value={value}>
      {children}
    </TaskBoardContext.Provider>
  );
}

// ─── Consumer hook ───
export function useTaskBoard(): TaskBoardContextValue {
  const ctx = useContext(TaskBoardContext);
  if (!ctx) {
    throw new Error('useTaskBoard must be used within <TaskBoardProvider>');
  }
  return ctx;
}
