// ─── Task Board Context (Section 8/17 of spec) ───
// Single source of truth for all Task Board state.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { TaskBoardContext, type TaskBoardContextValue } from './TaskBoardContextDefinition';
import {
  addBoardMembers,
  createColumn as createColumnRequest,
  createTask as createTaskRequest,
  createTaskGroup,
  createTaskUpdate,
  deleteTask as deleteTaskRequest,
  deleteTaskGroup as deleteTaskGroupRequest,
  getTaskBoard,
  moveTaskGroup as moveTaskGroupRequest,
  moveTask as moveTaskRequest,
  patchTask,
  replaceColumns,
  restoreTask as restoreTaskRequest,
  restoreTaskGroup as restoreTaskGroupRequest,
  type BoardMoveTarget,
  type TaskBoardPayload,
  updateBoard as updateBoardRequest,
  updateTaskGroup,
  updateTaskUpdate as updateTaskUpdateRequest,
} from '../../../services/taskBoardService';
import { loadSession } from '../../../auth/auth';
import { useAuth } from '../../../auth/useAuth';

// ─── localStorage helpers (Section 18 of spec) ───
interface DeletedTaskSnapshot {
  task: Task;
  groupId: string;
  index: number;
  deletePromise: Promise<void>;
}

interface DeletedGroupSnapshot {
  group: TaskGroup;
  tasks: Task[];
  index: number;
  deletePromise: Promise<void>;
}

interface TaskCreateOptions {
  openDetails?: boolean;
  renameInDetails?: boolean;
}

const normalizeStatusKey = (value: string) => value.trim().toLowerCase().replace(/[-\s]+/g, '_');

function isDoneStatus(statusId: string, statusOptions: SelectOption[]) {
  const option = statusOptions.find((status) => status.id === statusId);
  const candidates = [statusId, option?.label ?? '', option?.workflowMeaning ?? ''];
  return candidates.some((candidate) => normalizeStatusKey(candidate) === 'done');
}

function syncTaskPatch(
  patch: Partial<Task>,
  statusOptions: SelectOption[],
  existingTask: Task,
  previousProgressBeforeDone?: number
) {
  const syncedPatch = { ...patch };

  if (patch.progress !== undefined) {
    syncedPatch.progress = Math.min(100, Math.max(0, Number(patch.progress) || 0));
  }

  if (patch.status !== undefined) {
    const nextStatusIsDone = isDoneStatus(String(patch.status), statusOptions);
    const currentStatusIsDone = isDoneStatus(existingTask.status, statusOptions);

    if (nextStatusIsDone) {
      syncedPatch.progress = 100;
    } else if (currentStatusIsDone && previousProgressBeforeDone !== undefined) {
      syncedPatch.progress = previousProgressBeforeDone;
    }
  }

  return syncedPatch;
}

// ─── Provider ───
interface UserBoardOrderPreferences {
  columnOrder: string[];
  groupOrder: string[];
  taskOrderByGroup: Record<string, string[]>;
}

const emptyOrderPreferences = (): UserBoardOrderPreferences => ({
  columnOrder: [],
  groupOrder: [],
  taskOrderByGroup: {},
});

function mergeOrderedIds(savedOrder: string[], availableIds: string[]) {
  const availableSet = new Set(availableIds);
  const merged = savedOrder.filter((id) => availableSet.has(id));
  for (const id of availableIds) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }
  return merged;
}

function applyColumnOrder(columns: ColumnDefinition[], columnOrder: string[]) {
  if (columnOrder.length === 0) return columns;
  const mergedOrder = mergeOrderedIds(columnOrder, columns.map((column) => column.id));
  const orderMap = new Map(mergedOrder.map((id, index) => [id, index]));
  return columns.map((column) => ({ ...column, order: orderMap.get(column.id) ?? column.order }));
}

function applyGroupAndTaskOrder(groups: TaskGroup[], preferences: UserBoardOrderPreferences) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const orderedGroupIds = mergeOrderedIds(preferences.groupOrder, groups.map((group) => group.id));
  return orderedGroupIds
    .map((groupId, index) => {
      const group = groupsById.get(groupId);
      if (!group) return null;
      const taskIds = mergeOrderedIds(preferences.taskOrderByGroup[group.id] ?? [], group.taskIds);
      return { ...group, order: index, taskIds };
    })
    .filter((group): group is TaskGroup => Boolean(group));
}

function isColumnOrderOnlyChange(previousColumns: ColumnDefinition[], nextColumns: ColumnDefinition[]) {
  if (previousColumns.length !== nextColumns.length) return false;
  const previousById = new Map(previousColumns.map((column) => [column.id, column]));
  return nextColumns.every((nextColumn) => {
    const previousColumn = previousById.get(nextColumn.id);
    if (!previousColumn) return false;
    return previousColumn.label === nextColumn.label
      && previousColumn.type === nextColumn.type
      && previousColumn.width === nextColumn.width
      && previousColumn.isVisible === nextColumn.isVisible
      && previousColumn.isSystemColumn === nextColumn.isSystemColumn
      && JSON.stringify(previousColumn.options ?? []) === JSON.stringify(nextColumn.options ?? []);
  });
}

interface TaskBoardProviderProps {
  workspaceId: string;
  boardId: string;
  children: ReactNode;
}

export function TaskBoardProvider({ workspaceId, boardId, children }: TaskBoardProviderProps) {
  const { profile } = useAuth();
  const userEmail = loadSession()?.email ?? 'anonymous';
  const orderPreferencesKey = `taskboard_order_preferences_${userEmail}_${workspaceId}_${boardId}`;
  const orderPreferencesRef = useRef<UserBoardOrderPreferences>(emptyOrderPreferences());

  const loadOrderPreferences = useCallback(() => {
    try {
      const raw = localStorage.getItem(orderPreferencesKey);
      orderPreferencesRef.current = raw
        ? { ...emptyOrderPreferences(), ...JSON.parse(raw) as Partial<UserBoardOrderPreferences> }
        : emptyOrderPreferences();
    } catch {
      orderPreferencesRef.current = emptyOrderPreferences();
    }
    return orderPreferencesRef.current;
  }, [orderPreferencesKey]);

  const saveOrderPreferences = useCallback((updater: (current: UserBoardOrderPreferences) => UserBoardOrderPreferences) => {
    const next = updater(orderPreferencesRef.current);
    orderPreferencesRef.current = next;
    try {
      localStorage.setItem(orderPreferencesKey, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save taskboard order preferences', e);
    }
  }, [orderPreferencesKey]);
  // ─── Base States ───
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({ workspaceId: boardId, columns: [], statusOptions: [], priorityOptions: [] });

  const [groups, setGroups] = useState<TaskGroup[]>([]);

  const [tasks, setTasks] = useState<Record<string, Task>>({});

  const [manualGroupOrder, setManualGroupOrder] = useState<string[]>([]);

  const [users, setUsers] = useState<Record<string, TaskBoardState['users'][string]>>({});
  const [availableBoards, setAvailableBoards] = useState<BoardMoveTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [deleteNotice, setDeleteNotice] = useState<{ label: string; type: 'task' | 'group' } | null>(null);
  const [deletedTaskSnapshot, setDeletedTaskSnapshot] = useState<DeletedTaskSnapshot | null>(null);
  const [deletedGroupSnapshot, setDeletedGroupSnapshot] = useState<DeletedGroupSnapshot | null>(null);
  const [taskRenameRequestId, setTaskRenameRequestId] = useState<string | null>(null);
  const pendingRenameIdRef = useRef<string | null>(null);
  const progressBeforeDoneRef = useRef<Record<string, number>>({});

  // Live filter & sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'none' | 'taskCount' | 'alphabetical'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const hydrateUsersWithCurrentProfile = useCallback(
    (incomingUsers: Record<string, TaskBoardState['users'][string]>) => {
      if (!profile) {
        return incomingUsers;
      }
      const entry = Object.entries(incomingUsers).find(([, user]) => user.email === profile.email);
      if (!entry) {
        return incomingUsers;
      }
      const [userId, currentUser] = entry;
      return {
        ...incomingUsers,
        [userId]: {
          ...currentUser,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          initials: profile.name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        },
      };
    },
    [profile],
  );

  useEffect(() => {
    setUsers((prev) => hydrateUsersWithCurrentProfile(prev));
  }, [hydrateUsersWithCurrentProfile]);

  // Re-init state when workspace/board ID changes
  useEffect(() => {
    let cancelled = false;
    const preferences = loadOrderPreferences();
    setIsLoading(true);
    setError(null);

    setBoardConfig({ workspaceId: boardId, columns: [], statusOptions: [], priorityOptions: [] });
    setGroups([]);
    setTasks({});
    setManualGroupOrder([]);
    setUsers({});
    setAvailableBoards([]);

    setPanel({ isOpen: false, taskId: null, activeTab: 'updates' });
    setCollapsedGroups(new Set());
    setCompletedTasks(new Set());
    setDeleteNotice(null);
    setDeletedTaskSnapshot(null);
    setDeletedGroupSnapshot(null);
    setTaskRenameRequestId(null);
    pendingRenameIdRef.current = null;
    progressBeforeDoneRef.current = {};
    setSearchQuery('');
    setSortMode('none');
    setSortDirection('desc');

    void getTaskBoard(workspaceId, boardId)
      .then((payload) => {
        if (cancelled) return;
        const preferredColumns = applyColumnOrder(payload.boardConfig.columns, preferences.columnOrder);
        const preferredGroups = applyGroupAndTaskOrder(payload.groups, preferences);
        setBoardConfig({ ...payload.boardConfig, columns: preferredColumns });
        setGroups(preferredGroups);
        setTasks(payload.tasks);
        setUsers(hydrateUsersWithCurrentProfile(payload.users));
        setManualGroupOrder(preferredGroups.map((g) => g.id));
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
  }, [workspaceId, boardId, loadOrderPreferences, hydrateUsersWithCurrentProfile]);

  // Backend is the source of truth; this keeps optimistic update call sites simple.
  const syncStorage = useCallback((...args: unknown[]) => {
    void args;
  }, []);

  // ─── Actions ───
  const applyBoardPayload = useCallback((payload: TaskBoardPayload) => {
    const preferences = orderPreferencesRef.current;
    const preferredColumns = applyColumnOrder(payload.boardConfig.columns, preferences.columnOrder);
    const preferredGroups = applyGroupAndTaskOrder(payload.groups, preferences);
    setBoardConfig({ ...payload.boardConfig, columns: preferredColumns });
    setGroups(preferredGroups);
    setTasks(payload.tasks);
    setUsers(hydrateUsersWithCurrentProfile(payload.users));
    setManualGroupOrder(preferredGroups.map((g) => g.id));
    setAvailableBoards(payload.availableBoards);
  }, [hydrateUsersWithCurrentProfile]);

  const refreshBoardPayload = useCallback(() => {
    void getTaskBoard(workspaceId, boardId)
      .then(applyBoardPayload)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to refresh task board'));
  }, [workspaceId, boardId, applyBoardPayload]);

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
    const existingTask = tasks[taskId];
    if (!existingTask) return;

    if (patch.status !== undefined) {
      const nextStatusIsDone = isDoneStatus(String(patch.status), boardConfig.statusOptions);
      const currentStatusIsDone = isDoneStatus(existingTask.status, boardConfig.statusOptions);

      if (nextStatusIsDone && !currentStatusIsDone) {
        progressBeforeDoneRef.current[taskId] = Math.min(100, Math.max(0, Number(existingTask.progress) || 0));
      } else if (!nextStatusIsDone && currentStatusIsDone) {
        progressBeforeDoneRef.current[taskId] ??= Math.min(100, Math.max(0, Number(existingTask.progress) || 0));
      }
    }

    const syncedPatch = syncTaskPatch(
      patch,
      boardConfig.statusOptions,
      existingTask,
      progressBeforeDoneRef.current[taskId]
    );

    if (
      patch.status !== undefined &&
      !isDoneStatus(String(patch.status), boardConfig.statusOptions) &&
      isDoneStatus(existingTask.status, boardConfig.statusOptions)
    ) {
      delete progressBeforeDoneRef.current[taskId];
    }

    setTasks((prev) => {
      const existing = prev[taskId];
      if (!existing) return prev;
      const updated = {
        ...prev,
        [taskId]: {
          ...existing,
          ...syncedPatch,
          updatedAt: new Date().toISOString(),
        },
      };
      // Keep assigneeId in sync with the first item in assigneeIds for safety/legacy components
      if (syncedPatch.assigneeIds !== undefined) {
        updated[taskId].assigneeId = syncedPatch.assigneeIds.length > 0 ? syncedPatch.assigneeIds[0] : null;
      }
      syncStorage(boardConfig, groups, updated, manualGroupOrder);
      return updated;
    });
    void patchTask(workspaceId, boardId, taskId, syncedPatch)
      .then((savedTask) => {
        setTasks((prev) => ({ ...prev, [savedTask.id]: savedTask }));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to update task');
      });
  }, [workspaceId, boardId, boardConfig, groups, manualGroupOrder, syncStorage, tasks]);

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
    setTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...existing,
        updates: [...(existing.updates || []), optimisticUpdate],
        files: [...(existing.files || []), ...attachments],
        updatedAt: new Date().toISOString(),
      },
    }));
    void createTaskUpdate(workspaceId, boardId, taskId, { content, attachments, mentions })
      .then(() => {
        void getTaskBoard(workspaceId, boardId).then((payload) => {
          setBoardConfig(payload.boardConfig);
          setGroups(payload.groups);
          setTasks(payload.tasks);
          setUsers(hydrateUsersWithCurrentProfile(payload.users));
          setManualGroupOrder(payload.groups.map((g) => g.id));
          setAvailableBoards(payload.availableBoards);
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create update'));
  }, [workspaceId, boardId, tasks, users, hydrateUsersWithCurrentProfile]);

  const editTaskUpdate = useCallback((taskId: string, updateId: string, content: string, mentions: string[]) => {
    const existing = tasks[taskId];
    if (!existing) return;
    const previousUpdates = existing.updates || [];
    const optimisticUpdates = previousUpdates.map((update) =>
      update.id === updateId
        ? { ...update, content, mentions, updatedAt: new Date().toISOString() }
        : update
    );
    setTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        updates: optimisticUpdates,
        updatedAt: new Date().toISOString(),
      },
    }));
    void updateTaskUpdateRequest(workspaceId, boardId, taskId, updateId, { content, mentions })
      .then((savedUpdate) => {
        setTasks((prev) => {
          const current = prev[taskId];
          if (!current) return prev;
          return {
            ...prev,
            [taskId]: {
              ...current,
              updates: current.updates.map((update) => update.id === savedUpdate.id ? savedUpdate : update),
              updatedAt: new Date().toISOString(),
            },
          };
        });
      })
      .catch((e) => {
        setTasks((prev) => {
          const current = prev[taskId];
          if (!current) return prev;
          return {
            ...prev,
            [taskId]: {
              ...current,
              updates: previousUpdates,
            },
          };
        });
        setError(e instanceof Error ? e.message : 'Failed to edit update');
      });
  }, [workspaceId, boardId, tasks]);

  const addTask = useCallback((task: Task, options: TaskCreateOptions = {}) => {
    const shouldOpenDetails = options.openDetails === true;
    const shouldRenameInDetails = shouldOpenDetails && options.renameInDetails === true;
    const updatedTasks = { ...tasks, [task.id]: task };
    const updatedGroups = groups.map((g) =>
      g.id === task.groupId ? { ...g, taskIds: [...g.taskIds, task.id] } : g
    );

    setTasks(updatedTasks);
    setGroups(updatedGroups);
    if (shouldOpenDetails) {
      setPanel({ isOpen: true, taskId: task.id, activeTab: 'updates' });
    }
    if (shouldRenameInDetails) {
      setTaskRenameRequestId(task.id);
      pendingRenameIdRef.current = task.id;
    }
    syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
    void createTaskRequest(workspaceId, boardId, task.groupId, { name: task.name, dueDate: task.dueDate })
      .then((created) => {
        setTasks((prev) => {
          const rest = { ...prev };
          delete rest[task.id];
          return { ...rest, [created.id]: created };
        });
        setGroups((prev) => prev.map((g) => (
          g.id === task.groupId
            ? { ...g, taskIds: g.taskIds.map((id) => (id === task.id ? created.id : id)) }
            : g
        )));
        if (pendingRenameIdRef.current === task.id) {
          pendingRenameIdRef.current = created.id;
          setTaskRenameRequestId(created.id);
        }
        setPanel((prev) => (prev.taskId === task.id ? { ...prev, taskId: created.id } : prev));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create task'));
  }, [workspaceId, boardId, tasks, groups, boardConfig, manualGroupOrder, syncStorage]);

  const addTaskToGroup = useCallback((
    groupId: string,
    defaults?: Partial<Pick<Task, 'name' | 'dueDate'>>,
    options?: TaskCreateOptions
  ) => {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      name: defaults?.name?.trim() || 'New Task',
      groupId: targetGroup.id,
      workspaceId: boardId,
      assigneeId: null,
      assigneeIds: [],
      status: boardConfig.statusOptions[0]?.id || '',
      priority: boardConfig.priorityOptions[0]?.id || '',
      dueDate: defaults?.dueDate ?? null,
      progress: 0,
      budget: null,
      files: [],
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTask(newTask, options);
  }, [groups, boardId, boardConfig, addTask]);

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
    addTaskToGroup(activeGroups[0].id);
  }, [visibleGroups, addTaskToGroup]);

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
          refreshBoardPayload();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create group'));
  }, [workspaceId, boardId, groups, manualGroupOrder, tasks, boardConfig, syncStorage, refreshBoardPayload]);

  const moveTask = useCallback(
    (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => {
      const updatedGroups = groups.map((g) => {
        if (fromGroupId === toGroupId && g.id === fromGroupId) {
          const ids = g.taskIds.filter((id) => id !== taskId);
          const safeIndex = Math.max(0, Math.min(newIndex, ids.length));
          ids.splice(safeIndex, 0, taskId);
          return { ...g, taskIds: ids };
        }
        if (g.id === fromGroupId) {
          return { ...g, taskIds: g.taskIds.filter((id) => id !== taskId) };
        }
        if (g.id === toGroupId) {
          const ids = g.taskIds.filter((id) => id !== taskId);
          const safeIndex = Math.max(0, Math.min(newIndex, ids.length));
          ids.splice(safeIndex, 0, taskId);
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
      saveOrderPreferences((current) => ({
        ...current,
        taskOrderByGroup: {
          ...current.taskOrderByGroup,
          ...Object.fromEntries(updatedGroups.map((group) => [group.id, group.taskIds])),
        },
      }));
      if (fromGroupId === toGroupId) {
        return;
      }
      void moveTaskRequest(workspaceId, boardId, taskId, {
        toBoardId: boardId,
        toGroupId,
        position: Math.max(0, newIndex),
      })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to move task'));
    },
    [workspaceId, boardId, groups, tasks, boardConfig, manualGroupOrder, syncStorage, refreshBoardPayload, saveOrderPreferences]
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
      saveOrderPreferences((current) => ({
        ...current,
        taskOrderByGroup: {
          ...current.taskOrderByGroup,
          ...Object.fromEntries(updatedGroups.map((group) => [group.id, group.taskIds])),
        },
      }));
      void moveTaskRequest(workspaceId, boardId, taskId, {
        toBoardId: boardId,
        toGroupId,
        position: groups.find((g) => g.id === toGroupId)?.taskIds.length ?? 0,
      })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to move task'));
    },
    [workspaceId, boardId, tasks, groups, boardConfig, manualGroupOrder, syncStorage, refreshBoardPayload, saveOrderPreferences]
  );

  const moveTaskToBoardGroup = useCallback(
    (taskId: string, toBoardId: string, toGroupId: string) => {
      if (toBoardId === boardId) {
        moveTaskToGroup(taskId, toGroupId);
        return;
      }

      const task = tasks[taskId];
      const targetBoard = availableBoards.find((board) => board.id === toBoardId);
      const targetGroup = targetBoard?.groups.find((group) => group.id === toGroupId);
      if (!task || !targetBoard || !targetGroup) return;

      const updatedCurrentTasks = { ...tasks };
      delete updatedCurrentTasks[taskId];
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

      syncStorage(boardConfig, updatedCurrentGroups, updatedCurrentTasks, manualGroupOrder);
      void moveTaskRequest(workspaceId, boardId, taskId, {
        toBoardId,
        toGroupId,
        position: targetGroup.taskIds.length,
      })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to move task'));
    },
    [workspaceId, boardId, moveTaskToGroup, tasks, groups, availableBoards, boardConfig, manualGroupOrder, syncStorage, refreshBoardPayload]
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
      const taskToDelete = tasks[taskId];
      if (!taskToDelete) return;
      const sourceGroup = groups.find((group) => group.taskIds.includes(taskId));
      const sourceIndex = sourceGroup ? sourceGroup.taskIds.indexOf(taskId) : -1;
      const updatedTasks = { ...tasks };
      delete updatedTasks[taskId];
      const updatedGroups = groups.map((g) => ({
        ...g,
        taskIds: g.taskIds.filter((id) => id !== taskId),
      }));

      setTasks(updatedTasks);
      setGroups(updatedGroups);
      const deletePromise = deleteTaskRequest(workspaceId, boardId, taskId).catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to delete task');
      });

      setDeletedTaskSnapshot({
        task: taskToDelete,
        groupId: sourceGroup?.id ?? taskToDelete.groupId,
        index: Math.max(0, sourceIndex),
        deletePromise,
      });
      setDeleteNotice({ label: taskToDelete.name, type: 'task' });
      setPanel((prev) => (prev.taskId === taskId ? { isOpen: false, taskId: null, activeTab: 'updates' } : prev));
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      syncStorage(boardConfig, updatedGroups, updatedTasks, manualGroupOrder);
    },
    [workspaceId, boardId, tasks, groups, boardConfig, manualGroupOrder, syncStorage]
  );

  const dismissDeleteNotice = useCallback(() => {
    setDeleteNotice(null);
  }, []);

  const undoTaskDelete = useCallback(() => {
    if (deletedGroupSnapshot) {
      const { group, tasks: deletedTasks, index, deletePromise } = deletedGroupSnapshot;
      const restoredTasks = Object.fromEntries(deletedTasks.map((task) => [task.id, task]));
      setTasks((prev) => ({ ...prev, ...restoredTasks }));
      setGroups((prev) => {
        if (prev.some((existing) => existing.id === group.id)) return prev;
        const next = [...prev];
        next.splice(Math.max(0, Math.min(index, next.length)), 0, group);
        return next;
      });
      setManualGroupOrder((prev) => {
        if (prev.includes(group.id)) return prev;
        const next = [...prev];
        next.splice(Math.max(0, Math.min(index, next.length)), 0, group.id);
        return next;
      });
      setDeleteNotice(null);
      setDeletedGroupSnapshot(null);
      void deletePromise
        .then(() => restoreTaskGroupRequest(workspaceId, boardId, group.id))
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to restore group'));
      return;
    }

    if (!deletedTaskSnapshot) return;
    const { task, groupId, index, deletePromise } = deletedTaskSnapshot;

    setTasks((prev) => ({ ...prev, [task.id]: task }));
    setGroups((prev) => prev.map((group) => {
      if (group.id !== groupId || group.taskIds.includes(task.id)) return group;
      const nextIds = [...group.taskIds];
      nextIds.splice(Math.max(0, Math.min(index, nextIds.length)), 0, task.id);
      return { ...group, taskIds: nextIds };
    }));
    setDeleteNotice(null);
    setDeletedTaskSnapshot(null);
    void deletePromise
      .then(() => restoreTaskRequest(workspaceId, boardId, task.id))
      .then((restored) => {
        setTasks((prev) => ({ ...prev, [restored.id]: restored }));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to restore task'));
  }, [workspaceId, boardId, deletedTaskSnapshot, deletedGroupSnapshot, refreshBoardPayload]);

  const consumeTaskRenameRequest = useCallback((taskId: string) => {
    setTaskRenameRequestId((prev) => (prev === taskId ? null : prev));
    if (pendingRenameIdRef.current === taskId) {
      pendingRenameIdRef.current = null;
    }
  }, []);

  const updateColumns = useCallback(
    (columns: ColumnDefinition[]) => {
      const updatedConfig = { ...boardConfig, columns };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
      if (isColumnOrderOnlyChange(boardConfig.columns, columns)) {
        saveOrderPreferences((current) => ({ ...current, columnOrder: [...columns].sort((a, b) => a.order - b.order).map((column) => column.id) }));
        return;
      }
      void replaceColumns(workspaceId, boardId, columns)
        .then((savedColumns) => {
          const preferredColumns = applyColumnOrder(savedColumns, orderPreferencesRef.current.columnOrder);
          setBoardConfig((prev) => ({ ...prev, columns: preferredColumns }));
          refreshBoardPayload();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update columns'));
    },
    [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage, refreshBoardPayload, saveOrderPreferences]
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
          refreshBoardPayload();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to create column'));
    },
    [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage, refreshBoardPayload]
  );

  const reorderGroups = useCallback(
    (newGroups: TaskGroup[]) => {
      const updatedOrder = newGroups.map((g) => g.id);
      setManualGroupOrder(updatedOrder);
      syncStorage(boardConfig, groups, tasks, updatedOrder);
      saveOrderPreferences((current) => ({ ...current, groupOrder: updatedOrder }));
    },
    [boardConfig, groups, tasks, syncStorage, saveOrderPreferences]
  );

  const updateGroupColor = useCallback(
    (groupId: string, color: string) => {
      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, color } : g
      );
      setGroups(updatedGroups);
      syncStorage(boardConfig, updatedGroups, tasks, manualGroupOrder);
      void updateTaskGroup(workspaceId, boardId, groupId, { color })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update group'));
    },
    [workspaceId, boardId, groups, boardConfig, tasks, manualGroupOrder, syncStorage, refreshBoardPayload]
  );

  const updateGroupName = useCallback(
    (groupId: string, name: string) => {
      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      );
      setGroups(updatedGroups);
      syncStorage(boardConfig, updatedGroups, tasks, manualGroupOrder);
      void updateTaskGroup(workspaceId, boardId, groupId, { name })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update group'));
    },
    [workspaceId, boardId, groups, boardConfig, tasks, manualGroupOrder, syncStorage, refreshBoardPayload]
  );

  const moveGroupToBoard = useCallback(
    (groupId: string, toBoardId: string) => {
      if (toBoardId === boardId) return;

      const groupToMove = groups.find((g) => g.id === groupId);
      if (!groupToMove) return;

      const movedTaskIdSet = new Set(groupToMove.taskIds);
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

      syncStorage(boardConfig, updatedCurrentGroups, updatedCurrentTasks, updatedCurrentOrder);
      void moveTaskGroupRequest(workspaceId, boardId, groupId, { toBoardId })
        .then(refreshBoardPayload)
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to move group'));
    },
    [workspaceId, boardId, groups, manualGroupOrder, tasks, boardConfig, syncStorage, refreshBoardPayload]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      const groupToDelete = groups.find((g) => g.id === groupId);
      if (!groupToDelete) return;

      const taskIdsToDelete = new Set(groupToDelete.taskIds);
      const groupIndex = groups.findIndex((g) => g.id === groupId);
      const tasksToDelete = groupToDelete.taskIds.map((taskId) => tasks[taskId]).filter((task): task is Task => Boolean(task));
      const updatedGroups = groups.filter((g) => g.id !== groupId);
      const updatedOrder = manualGroupOrder.filter((id) => id !== groupId);
      const updatedTasks = Object.fromEntries(
        Object.entries(tasks).filter(([taskId]) => !taskIdsToDelete.has(taskId))
      );

      setGroups(updatedGroups);
      setManualGroupOrder(updatedOrder);
      setTasks(updatedTasks);
      const deletePromise = deleteTaskGroupRequest(workspaceId, boardId, groupId).catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to delete group');
      });
      setDeletedTaskSnapshot(null);
      setDeletedGroupSnapshot({
        group: groupToDelete,
        tasks: tasksToDelete,
        index: Math.max(0, groupIndex),
        deletePromise,
      });
      setDeleteNotice({ label: groupToDelete.name, type: 'group' });
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
    [workspaceId, boardId, groups, manualGroupOrder, tasks, boardConfig, syncStorage]
  );

  const updateStatusOptions = useCallback(
    (statusOptions: SelectOption[]) => {
      const columns = boardConfig.columns.map((column) => (
        column.id === 'col_status' ? { ...column, options: statusOptions } : column
      ));
      const updatedConfig = { ...boardConfig, columns, statusOptions };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
      void replaceColumns(workspaceId, boardId, columns)
        .then((savedColumns) => {
          setBoardConfig((prev) => ({ ...prev, columns: savedColumns }));
          refreshBoardPayload();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update status options'));
    },
    [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage, refreshBoardPayload]
  );

  const updatePriorityOptions = useCallback(
    (priorityOptions: SelectOption[]) => {
      const columns = boardConfig.columns.map((column) => (
        column.id === 'col_priority' ? { ...column, options: priorityOptions } : column
      ));
      const updatedConfig = { ...boardConfig, columns, priorityOptions };
      setBoardConfig(updatedConfig);
      syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
      void replaceColumns(workspaceId, boardId, columns)
        .then((savedColumns) => {
          setBoardConfig((prev) => ({ ...prev, columns: savedColumns }));
          refreshBoardPayload();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update priority options'));
    },
    [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage, refreshBoardPayload]
  );

  const renameBoard = useCallback((name: string) => {
    const nextName = name.trim();
    if (!nextName || nextName === boardConfig.boardName) return;
    const previousConfig = boardConfig;
    const updatedConfig = { ...boardConfig, boardName: nextName };
    setBoardConfig(updatedConfig);
    syncStorage(updatedConfig, groups, tasks, manualGroupOrder);
    void updateBoardRequest(workspaceId, boardId, { name: nextName })
      .then((payload) => {
        setBoardConfig(payload.boardConfig);
        setGroups(payload.groups);
        setTasks(payload.tasks);
        setUsers(hydrateUsersWithCurrentProfile(payload.users));
        setManualGroupOrder(payload.groups.map((g) => g.id));
        setAvailableBoards(payload.availableBoards);
        window.dispatchEvent(new CustomEvent('taskboard:board-renamed', {
          detail: { workspaceId, boardId, name: payload.boardConfig.boardName ?? nextName },
        }));
      })
      .catch((e) => {
        setBoardConfig(previousConfig);
        syncStorage(previousConfig, groups, tasks, manualGroupOrder);
        setError(e instanceof Error ? e.message : 'Failed to rename board');
      });
  }, [workspaceId, boardId, boardConfig, groups, tasks, manualGroupOrder, syncStorage, hydrateUsersWithCurrentProfile]);

  const inviteBoardMembers = useCallback(async (userIds: number[]) => {
    if (userIds.length === 0) return;
    try {
      setIsLoading(true);
      const payload = await addBoardMembers(workspaceId, boardId, userIds);
      applyBoardPayload(payload);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to invite members');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, boardId, applyBoardPayload]);

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
      editTaskUpdate,
      addTask,
      addTaskToGroup,
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
      renameBoard,
      inviteBoardMembers,
      deleteNotice,
      undoTaskDelete,
      dismissDeleteNotice,
      taskRenameRequestId,
      consumeTaskRenameRequest,
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
      editTaskUpdate,
      addTask,
      addTaskToGroup,
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
      renameBoard,
      inviteBoardMembers,
      deleteNotice,
      undoTaskDelete,
      dismissDeleteNotice,
      taskRenameRequestId,
      consumeTaskRenameRequest,
    ]
  );

  return (
    <TaskBoardContext.Provider value={value}>
      {children}
    </TaskBoardContext.Provider>
  );
}

