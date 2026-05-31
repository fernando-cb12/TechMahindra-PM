import { createContext } from 'react';
import type {
  BoardView,
  ColumnDefinition,
  PanelState,
  SelectOption,
  Task,
  TaskBoardState,
  TaskGroup,
} from './types';
import type { BoardMoveTarget } from '../../../services/taskBoardService';

export interface TaskBoardContextValue extends Omit<TaskBoardState, 'manualGroupOrder'> {
  manualGroupOrder: string[];
  availableBoards: BoardMoveTarget[];
  isLoading: boolean;
  error: string | null;
  setActiveView: (view: BoardView) => void;
  openPanel: (taskId: string) => void;
  closePanel: () => void;
  setPanelTab: (tab: PanelState['activeTab']) => void;
  toggleGroupCollapse: (groupId: string) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  postTaskUpdate: (taskId: string, content: string, attachments: Task['files'], mentions: string[]) => void;
  addTask: (task: Task, options?: { openDetails?: boolean; renameInDetails?: boolean }) => void;
  addTaskToGroup: (
    groupId: string,
    defaults?: Partial<Pick<Task, 'name' | 'dueDate'>>,
    options?: { openDetails?: boolean; renameInDetails?: boolean }
  ) => void;
  addTaskToFirstGroup: () => void;
  moveTask: (taskId: string, fromGroupId: string, toGroupId: string, newIndex: number) => void;
  moveTaskToGroup: (taskId: string, toGroupId: string) => void;
  moveTaskToBoardGroup: (taskId: string, toBoardId: string, toGroupId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  updateColumns: (columns: ColumnDefinition[]) => void;
  addColumn: (col: ColumnDefinition) => void;
  updateStatusOptions: (options: SelectOption[]) => void;
  updatePriorityOptions: (options: SelectOption[]) => void;
  renameBoard: (name: string) => void;
  reorderGroups: (newGroups: TaskGroup[]) => void;
  addGroupAtSecondPosition: () => void;
  updateGroupColor: (groupId: string, color: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveGroupToBoard: (groupId: string, toBoardId: string) => void;
  deleteGroup: (groupId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: 'none' | 'taskCount' | 'alphabetical';
  setSortMode: (mode: 'none' | 'taskCount' | 'alphabetical') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;
  visibleGroups: TaskGroup[];
  completedTasks: Set<string>;
  deleteNotice: { label: string; type: 'task' | 'group' } | null;
  undoTaskDelete: () => void;
  dismissDeleteNotice: () => void;
  taskRenameRequestId: string | null;
  consumeTaskRenameRequest: (taskId: string) => void;
}

export const TaskBoardContext = createContext<TaskBoardContextValue | null>(null);
