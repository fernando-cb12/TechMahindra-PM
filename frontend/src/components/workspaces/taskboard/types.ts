// ─── Task Board TypeScript Interfaces (Section 3 of spec) ───

// Supported column types
export type ColumnType =
  | 'text'
  | 'assignee'
  | 'status'
  | 'priority'
  | 'date'
  | 'progress'
  | 'budget'
  | 'files';

// A column definition — user-configurable per workspace
export interface ColumnDefinition {
  id: string;
  label: string;
  type: ColumnType;
  width?: number;      // px, optional override
  isVisible: boolean;
  order: number;       // determines left-to-right render order
}

// Status and priority are workspace-level, user-configurable
export interface StatusOption {
  id: string;
  label: string;
  color: string;       // hex from theme tokens only
}

export interface PriorityOption {
  id: string;
  label: string;
  color: string;
}

// File attachment
export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;  // ISO date string
}

// Task update (for UpdatesTab)
export interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// A single task
export interface Task {
  id: string;
  name: string;
  groupId: string;
  workspaceId: string;
  assigneeId: string | null;
  status: string;          // StatusOption.id
  priority: string;        // PriorityOption.id
  dueDate: string | null;  // ISO date string — used by CalendarView
  progress: number;        // 0–100 — used by ChartView
  budget: number | null;
  files: FileAttachment[];
  updates: TaskUpdate[];
  createdAt: string;
  updatedAt: string;
}

// A group of tasks (phase / stage)
export interface TaskGroup {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  order: number;
  taskIds: string[];
}

// Workspace-level board configuration
export interface BoardConfig {
  workspaceId: string;
  boardName?: string;
  columns: ColumnDefinition[];
  statusOptions: StatusOption[];
  priorityOptions: PriorityOption[];
}

// User
export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  initials: string;
}

// Task detail panel state
export interface PanelState {
  isOpen: boolean;
  taskId: string | null;
  activeTab: 'updates' | 'files' | 'activity';
}

// Active view
export type BoardView = 'table' | 'chart' | 'calendar';

// Full board state
export interface TaskBoardState {
  boardConfig: BoardConfig;
  groups: TaskGroup[];
  tasks: Record<string, Task>;
  users: Record<string, User>;
  panel: PanelState;
  activeView: BoardView;
  collapsedGroups: Set<string>;  // local UI state, not persisted
}
