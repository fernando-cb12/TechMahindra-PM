// ─── Task Board TypeScript Interfaces (Section 3/16 of spec) ───

// Supported column types
export type ColumnType =
  | 'text'
  | 'assignee'
  | 'status'
  | 'priority'
  | 'date'
  | 'progress'
  | 'budget'
  | 'files'
  // Custom field types
  | 'shortText'
  | 'longText'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'time'
  | 'timeline'
  | 'singleSelect'
  | 'multiSelect'
  | 'person'
  | 'file'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula';

// Status and priority options / custom select options
export type WorkflowMeaning = 'none' | 'new' | 'in_progress' | 'done';

export interface SelectOption {
  id: string;
  label: string;
  color: string;       // hex from theme tokens or preset colors
  workflowMeaning?: WorkflowMeaning;
}

export type StatusOption = SelectOption;
export type PriorityOption = SelectOption;

// A column definition — user-configurable per workspace
export interface ColumnDefinition {
  id: string;
  label: string;
  type: ColumnType;
  width?: number;      // px, optional override
  isVisible: boolean;
  order: number;       // determines left-to-right render order
  options?: SelectOption[]; // custom select options for this column
  isSystemColumn?: boolean;
}

// File attachment
export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;  // ISO date string
  type: string;        // MIME type or extension
  size: number;        // size in bytes
  uploadedBy: User;    // who uploaded it
}

// Task update (for UpdatesTab)
export interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;  // ISO date string if edited
  attachments: FileAttachment[];
  mentions: string[];  // User.id array
}

export interface TaskActivity {
  id: string;
  taskId: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  eventType: string;
  fieldKey: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// A single task
export interface Task {
  id: string;
  name: string;
  groupId: string;
  workspaceId: string;
  assigneeId: string | null;  // For single-assignee legacy support
  assigneeIds: string[];      // Support multiple assignees (new specification)
  status: string;             // StatusOption.id or custom option id
  priority: string;           // PriorityOption.id or custom option id
  pointsValue?: number;       // Base points awarded for completing the task
  dueDate: string | null;     // ISO date string — used by CalendarView
  progress: number;           // 0–100 — used by ChartView
  budget: number | null;
  files: FileAttachment[];
  updates: TaskUpdate[];
  activities?: TaskActivity[];
  createdAt: string;
  updatedAt: string;
  values?: Record<string, unknown>; // Custom column values e.g. { columnId: value }
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

// User / Member
export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  initials: string;
  email?: string;
}

// Task detail panel state
export interface PanelState {
  isOpen: boolean;
  taskId: string | null;
  activeTab: 'updates' | 'files' | 'activity';
}

// Active view
export type BoardView = 'table' | 'insights' | 'calendar' | 'kanban';

// Full board state
export interface TaskBoardState {
  boardConfig: BoardConfig;
  groups: TaskGroup[];
  tasks: Record<string, Task>;
  users: Record<string, User>;
  panel: PanelState;
  activeView: BoardView;
  collapsedGroups: Set<string>;  // local UI state, not persisted
  manualGroupOrder: string[];    // Stores user's custom group order
}

