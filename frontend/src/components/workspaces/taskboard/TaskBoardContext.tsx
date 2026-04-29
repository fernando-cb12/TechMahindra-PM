// ─── Task Board Context (Section 8 of spec) ───
// Single source of truth for all Task Board state.
// ChartView, CalendarView, and MainTableView all consume this context.

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
  Task,
  TaskGroup,
  TaskBoardState,
} from './types';
import { getMockWorkspaceData, getMockUsers } from '../../../mocks/taskBoard';

// ─── Context value (state + actions) ───
interface TaskBoardContextValue extends TaskBoardState {
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
  addTask: (task: Task) => void;
  moveTask: (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => void;
  toggleTaskComplete: (taskId: string) => void;

  // Column management
  updateColumns: (columns: ColumnDefinition[]) => void;

  // Groups — mutations
  reorderGroups: (newGroups: TaskGroup[]) => void;

  // Completion tracking (local only)
  completedTasks: Set<string>;
}

const TaskBoardContext = createContext<TaskBoardContextValue | null>(null);

// ─── localStorage helpers (Section 5.4 / 7) ───
const STORAGE_KEY = (wsId: string) => `board_config_${wsId}`;

function loadColumnsFromStorage(wsId: string): ColumnDefinition[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(wsId));
    if (!raw) return null;
    return JSON.parse(raw) as ColumnDefinition[];
  } catch {
    return null;
  }
}

function saveColumnsToStorage(wsId: string, columns: ColumnDefinition[]) {
  localStorage.setItem(STORAGE_KEY(wsId), JSON.stringify(columns));
}

// ─── Provider ───
interface TaskBoardProviderProps {
  workspaceId: string;
  children: ReactNode;
}

export function TaskBoardProvider({ workspaceId, children }: TaskBoardProviderProps) {
  // Load mock data (this is the ONLY thing that changes at backend integration)
  const mockData = useMemo(() => getMockWorkspaceData(workspaceId), [workspaceId]);
  const users = useMemo(() => getMockUsers(), []);

  // ─── State ───
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(() => {
    if (!mockData) {
      return { workspaceId, columns: [], statusOptions: [], priorityOptions: [] };
    }
    const savedCols = loadColumnsFromStorage(workspaceId);
    return {
      ...mockData.config,
      columns: savedCols ?? mockData.config.columns,
    };
  });

  const [groups, setGroups] = useState<TaskGroup[]>(mockData?.groups ?? []);
  const [tasks, setTasks] = useState<Record<string, Task>>(mockData?.tasks ?? {});
  const [activeView, setActiveView] = useState<BoardView>('table');
  const [panel, setPanel] = useState<PanelState>({
    isOpen: false,
    taskId: null,
    activeTab: 'updates',
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Re-init when workspace changes
  useEffect(() => {
    const data = getMockWorkspaceData(workspaceId);
    if (!data) return;
    const savedCols = loadColumnsFromStorage(workspaceId);
    setBoardConfig({
      ...data.config,
      columns: savedCols ?? data.config.columns,
    });
    setGroups(data.groups);
    setTasks(data.tasks);
    setPanel({ isOpen: false, taskId: null, activeTab: 'updates' });
    setCollapsedGroups(new Set());
    setCompletedTasks(new Set());
  }, [workspaceId]);

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
      return { ...prev, [taskId]: { ...existing, ...patch, updatedAt: new Date().toISOString() } };
    });
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => ({ ...prev, [task.id]: task }));
    setGroups((prev) =>
      prev.map((g) =>
        g.id === task.groupId ? { ...g, taskIds: [...g.taskIds, task.id] } : g,
      ),
    );
  }, []);

  const moveTask = useCallback(
    (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === fromGroupId) {
            return { ...g, taskIds: g.taskIds.filter((id) => id !== taskId) };
          }
          if (g.id === toGroupId) {
            const ids = g.taskIds.filter((id) => id !== taskId);
            ids.splice(newIndex, 0, taskId);
            return { ...g, taskIds: ids };
          }
          return g;
        }),
      );
      setTasks((prev) => {
        const existing = prev[taskId];
        if (!existing) return prev;
        return { ...prev, [taskId]: { ...existing, groupId: toGroupId } };
      });
    },
    [],
  );

  const toggleTaskComplete = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const updateColumns = useCallback(
    (columns: ColumnDefinition[]) => {
      setBoardConfig((prev) => ({ ...prev, columns }));
      saveColumnsToStorage(workspaceId, columns);
    },
    [workspaceId],
  );

  const reorderGroups = useCallback((newGroups: TaskGroup[]) => {
    setGroups(newGroups);
  }, []);

  // ─── Memoized value ───
  const value = useMemo<TaskBoardContextValue>(
    () => ({
      boardConfig,
      groups,
      tasks,
      users,
      panel,
      activeView,
      collapsedGroups,
      completedTasks,
      setActiveView,
      openPanel,
      closePanel,
      setPanelTab,
      toggleGroupCollapse,
      updateTask,
      addTask,
      moveTask,
      toggleTaskComplete,
      updateColumns,
      reorderGroups,
    }),
    [
      boardConfig, groups, tasks, users, panel, activeView,
      collapsedGroups, completedTasks, setActiveView,
      openPanel, closePanel, setPanelTab, toggleGroupCollapse,
      updateTask, addTask, moveTask, toggleTaskComplete,
      updateColumns, reorderGroups,
    ],
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
  if (!ctx) throw new Error('useTaskBoard must be used within <TaskBoardProvider>');
  return ctx;
}
