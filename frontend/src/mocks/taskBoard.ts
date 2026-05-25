// ─── Task Board Data (Section 4 of spec) ───
// Accessed exclusively through useTaskBoardData hook — never import directly.

import type {
  BoardConfig,
  Task,
  TaskGroup,
  TaskUpdate,
  User,
} from '../components/workspaces/taskboard/types';

// ─── Users ───
export const USERS: Record<string, User> = {
  u1: { id: 'u1', name: 'Marco Ríos', avatarUrl: null, initials: 'MR' },
  u2: { id: 'u2', name: 'Lucia Fernández', avatarUrl: null, initials: 'LF' },
  u3: { id: 'u3', name: 'Akash Patel', avatarUrl: null, initials: 'AP' },
  u4: { id: 'u4', name: 'Sara Chen', avatarUrl: null, initials: 'SC' },
};

// ─── Options & Columns ───

const defaultStatusOptions = [
  { id: 'todo',        label: 'To Do',        color: '#B3B3B3' },
  { id: 'in_progress', label: 'In Progress',  color: '#EAC24F' },
  { id: 'review',      label: 'Review',       color: '#A3334D' },
  { id: 'done',        label: 'Done',         color: '#4CAF50' },
  { id: 'blocked',     label: 'Blocked',      color: '#FB485B' },
];

const defaultPriorityOptions = [
  { id: 'critical', label: 'Critical', color: '#FB485B' },
  { id: 'high',     label: 'High',     color: '#EAC24F' },
  { id: 'medium',   label: 'Medium',   color: '#A3334D' },
  { id: 'low',      label: 'Low',      color: '#20EA37' },
];

const standardColumns = [
  { id: 'col_name',     label: 'Task',       type: 'text'     as const, isVisible: true, order: 0 },
  { id: 'col_assignee', label: 'Assignee',   type: 'assignee' as const, isVisible: true, order: 1 },
  { id: 'col_status',   label: 'Status',     type: 'status'   as const, isVisible: true, order: 2 },
  { id: 'col_priority', label: 'Priority',   type: 'priority' as const, isVisible: true, order: 3 },
  { id: 'col_date',     label: 'Due Date',   type: 'date'     as const, isVisible: true, order: 4 },
  { id: 'col_progress', label: 'Progress',   type: 'progress' as const, isVisible: true, order: 5 },
];

const backendColumns = [
  { id: 'col_name',     label: 'Task',       type: 'text'     as const, isVisible: true, order: 0 },
  { id: 'col_assignee', label: 'Assignee',   type: 'assignee' as const, isVisible: true, order: 1 },
  { id: 'col_status',   label: 'Status',     type: 'status'   as const, isVisible: true, order: 2 },
  { id: 'col_priority', label: 'Priority',   type: 'priority' as const, isVisible: true, order: 3 },
  { id: 'col_budget',   label: 'Cost Estimate', type: 'budget' as const, isVisible: true, order: 4 },
  { id: 'col_progress', label: 'Progress',   type: 'progress' as const, isVisible: true, order: 5 },
];


// Helper to build realistic updates
function makeUpdates(taskId: string, authorIds: string[]): TaskUpdate[] {
  return authorIds.map((authorId, i) => ({
    id: `${taskId}_upd${i + 1}`,
    taskId,
    authorId,
    content: i === 0
      ? 'Started working on this component. PR should be up by tomorrow.'
      : 'Review comments addressed. Ready for final QA.',
    createdAt: new Date(2026, 3, 10 + i * 2).toISOString(),
    attachments: [],
    mentions: [],
  }));
}

// ==========================================
// ─── Workspace: Magenta | Board: Frontend
// ==========================================

export const MAGENTA_FRONTEND_CONFIG: BoardConfig = {
  workspaceId: 'magenta_frontend',
  boardName: 'Frontend Design',
  columns: standardColumns,
  statusOptions: defaultStatusOptions,
  priorityOptions: defaultPriorityOptions,
};

const frontendTasks: Record<string, Task> = {
  f1: {
    id: 'f1', name: 'Establish Component Architecture', groupId: 'fg1', workspaceId: 'magenta_frontend',
    assigneeId: 'u1', status: 'done', priority: 'high', dueDate: '2026-05-02',
    assigneeIds: ['u1'],
    progress: 100, budget: null, files: [], updates: makeUpdates('f1', ['u1']),
    createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-20T14:00:00Z',
  },
  f2: {
    id: 'f2', name: 'Implement React Router logic', groupId: 'fg1', workspaceId: 'magenta_frontend',
    assigneeId: 'u2', status: 'done', priority: 'critical', dueDate: '2026-05-04',
    assigneeIds: ['u2'],
    progress: 100, budget: null, files: [], updates: [],
    createdAt: '2026-04-02T10:00:00Z', updatedAt: '2026-04-22T09:00:00Z',
  },
  f3: {
    id: 'f3', name: 'Setup global state management', groupId: 'fg1', workspaceId: 'magenta_frontend',
    assigneeId: 'u4', status: 'review', priority: 'medium', dueDate: '2026-05-06',
    assigneeIds: ['u4'],
    progress: 90, budget: null, files: [], updates: makeUpdates('f3', ['u4', 'u1']),
    createdAt: '2026-04-03T10:00:00Z', updatedAt: '2026-04-03T10:00:00Z',
  },
  f4: {
    id: 'f4', name: 'Build Task Board main grid', groupId: 'fg2', workspaceId: 'magenta_frontend',
    assigneeId: 'u1', status: 'in_progress', priority: 'high', dueDate: '2026-05-10',
    assigneeIds: ['u1'],
    progress: 60, budget: null, files: [], updates: makeUpdates('f4', ['u1', 'u3']),
    createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-21T16:00:00Z',
  },
  f5: {
    id: 'f5', name: 'Integrate DnD for columns', groupId: 'fg2', workspaceId: 'magenta_frontend',
    assigneeId: 'u1', status: 'in_progress', priority: 'medium', dueDate: '2026-05-12',
    assigneeIds: ['u1'],
    progress: 40, budget: null, files: [], updates: [],
    createdAt: '2026-04-06T10:00:00Z', updatedAt: '2026-04-23T11:00:00Z',
  },
  f6: {
    id: 'f6', name: 'Create Recharts dashboard view', groupId: 'fg2', workspaceId: 'magenta_frontend',
    assigneeId: 'u4', status: 'todo', priority: 'low', dueDate: '2026-05-18',
    assigneeIds: ['u4'],
    progress: 0, budget: null, files: [], updates: [],
    createdAt: '2026-04-07T10:00:00Z', updatedAt: '2026-04-18T13:00:00Z',
  },
  f7: {
    id: 'f7', name: 'Write Cypress E2E test suite', groupId: 'fg3', workspaceId: 'magenta_frontend',
    assigneeId: 'u2', status: 'blocked', priority: 'critical', dueDate: '2026-05-20',
    assigneeIds: ['u2'],
    progress: 10, budget: null, files: [], updates: makeUpdates('f7', ['u2', 'u1']),
    createdAt: '2026-04-08T10:00:00Z', updatedAt: '2026-04-24T10:00:00Z',
  },
  f8: {
    id: 'f8', name: 'Audit accessibility (a11y)', groupId: 'fg3', workspaceId: 'magenta_frontend',
    assigneeId: 'u4', status: 'todo', priority: 'medium', dueDate: '2026-05-25',
    assigneeIds: ['u4'],
    progress: 0, budget: null, files: [], updates: [],
    createdAt: '2026-04-09T10:00:00Z', updatedAt: '2026-04-09T10:00:00Z',
  },
};

const frontendGroups: TaskGroup[] = [
  { id: 'fg1', workspaceId: 'magenta_frontend', name: 'Core Setup', color: '#A3334D', order: 0, taskIds: ['f1', 'f2', 'f3'] },
  { id: 'fg2', workspaceId: 'magenta_frontend', name: 'UI Components', color: '#EAC24F', order: 1, taskIds: ['f4', 'f5', 'f6'] },
  { id: 'fg3', workspaceId: 'magenta_frontend', name: 'Testing & QA', color: '#4CAF50', order: 2, taskIds: ['f7', 'f8'] },
];


// ==========================================
// ─── Workspace: Magenta | Board: Backend
// ==========================================

export const MAGENTA_BACKEND_CONFIG: BoardConfig = {
  workspaceId: 'magenta_backend',
  boardName: 'Backend Development',
  columns: backendColumns,
  statusOptions: defaultStatusOptions,
  priorityOptions: defaultPriorityOptions,
};

const backendTasks: Record<string, Task> = {
  b1: {
    id: 'b1', name: 'Define PostgreSQL schema', groupId: 'bg1', workspaceId: 'magenta_backend',
    assigneeId: 'u3', status: 'done', priority: 'critical', dueDate: '2026-05-01',
    assigneeIds: ['u3'],
    progress: 100, budget: 1200, files: [], updates: makeUpdates('b1', ['u3']),
    createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-19T15:00:00Z',
  },
  b2: {
    id: 'b2', name: 'Write Flyway database migrations', groupId: 'bg1', workspaceId: 'magenta_backend',
    assigneeId: 'u3', status: 'done', priority: 'high', dueDate: '2026-05-03',
    assigneeIds: ['u3'],
    progress: 100, budget: 800, files: [], updates: [],
    createdAt: '2026-04-02T10:00:00Z', updatedAt: '2026-04-23T14:00:00Z',
  },
  b3: {
    id: 'b3', name: 'Implement JWT Auth flow', groupId: 'bg2', workspaceId: 'magenta_backend',
    assigneeId: 'u2', status: 'review', priority: 'critical', dueDate: '2026-05-05',
    assigneeIds: ['u2'],
    progress: 95, budget: 2500, files: [], updates: makeUpdates('b3', ['u2', 'u3']),
    createdAt: '2026-04-04T10:00:00Z', updatedAt: '2026-04-04T10:00:00Z',
  },
  b4: {
    id: 'b4', name: 'REST endpoints for Tasks & Groups', groupId: 'bg2', workspaceId: 'magenta_backend',
    assigneeId: 'u3', status: 'in_progress', priority: 'high', dueDate: '2026-05-09',
    assigneeIds: ['u3'],
    progress: 65, budget: 3000, files: [], updates: makeUpdates('b4', ['u3']),
    createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-22T11:00:00Z',
  },
  b5: {
    id: 'b5', name: 'WebSocket connection for live updates', groupId: 'bg2', workspaceId: 'magenta_backend',
    assigneeId: 'u2', status: 'todo', priority: 'medium', dueDate: '2026-05-15',
    assigneeIds: ['u2'],
    progress: 0, budget: 4000, files: [], updates: [],
    createdAt: '2026-04-06T10:00:00Z', updatedAt: '2026-04-24T09:00:00Z',
  },
  b6: {
    id: 'b6', name: 'Setup Docker compose for local dev', groupId: 'bg3', workspaceId: 'magenta_backend',
    assigneeId: 'u1', status: 'done', priority: 'low', dueDate: '2026-05-02',
    assigneeIds: ['u1'],
    progress: 100, budget: 500, files: [], updates: [],
    createdAt: '2026-04-07T10:00:00Z', updatedAt: '2026-04-20T10:00:00Z',
  },
  b7: {
    id: 'b7', name: 'Configure Github Actions CI/CD', groupId: 'bg3', workspaceId: 'magenta_backend',
    assigneeId: 'u4', status: 'in_progress', priority: 'high', dueDate: '2026-05-12',
    assigneeIds: ['u4'],
    progress: 40, budget: 1500, files: [], updates: makeUpdates('b7', ['u4', 'u3']),
    createdAt: '2026-04-08T10:00:00Z', updatedAt: '2026-04-25T12:00:00Z',
  },
};

const backendGroups: TaskGroup[] = [
  { id: 'bg1', workspaceId: 'magenta_backend', name: 'Database', color: '#2196F3', order: 0, taskIds: ['b1', 'b2'] },
  { id: 'bg2', workspaceId: 'magenta_backend', name: 'API Layer', color: '#EAC24F', order: 1, taskIds: ['b3', 'b4', 'b5'] },
  { id: 'bg3', workspaceId: 'magenta_backend', name: 'Infrastructure', color: '#FB485B', order: 2, taskIds: ['b6', 'b7'] },
];


// ─── Export by workspace_board id ───

export interface WorkspaceMockData {
  config: BoardConfig;
  groups: TaskGroup[];
  tasks: Record<string, Task>;
}

export interface WorkspaceMockBoardSummary {
  id: string;
  name: string;
  groups: TaskGroup[];
}

const MOCK_DATA: Record<string, WorkspaceMockData> = {
  magenta_frontend: { config: MAGENTA_FRONTEND_CONFIG, groups: frontendGroups, tasks: frontendTasks },
  magenta_backend: { config: MAGENTA_BACKEND_CONFIG, groups: backendGroups, tasks: backendTasks },
};

export function getMockWorkspaceData(workspaceBoardId: string): WorkspaceMockData | null {
  return MOCK_DATA[workspaceBoardId] ?? null;
}

export function getMockWorkspaceBoards(workspaceId: string): WorkspaceMockBoardSummary[] {
  const prefix = `${workspaceId}_`;
  return Object.entries(MOCK_DATA)
    .filter(([id]) => id.startsWith(prefix))
    .map(([id, data]) => ({
      id,
      name: data.config.boardName ?? id.slice(prefix.length),
      groups: data.groups,
    }));
}

export function getMockUsers(): Record<string, User> {
  return USERS;
}
