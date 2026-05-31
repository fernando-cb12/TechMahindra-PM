import type { BoardConfig, Task, User } from './types';
import { resolveTaskWorkflow, type ResolvedWorkflowState } from './workflow';

export const UNASSIGNED_FILTER_ID = '__unassigned';

export interface TaskFilterState {
  groupIds: string[];
  assigneeIds: string[];
  priorityIds: string[];
  workflowStates: ResolvedWorkflowState[];
  tagIds: string[];
}

export interface FilterChoice {
  id: string;
  label: string;
  color?: string;
  groupLabel?: string;
}

export const EMPTY_TASK_FILTERS: TaskFilterState = {
  groupIds: [],
  assigneeIds: [],
  priorityIds: [],
  workflowStates: [],
  tagIds: [],
};

export type TaskFilterKey = keyof TaskFilterState;

export const WORKFLOW_FILTER_CHOICES: FilterChoice[] = [
  { id: 'new', label: 'New' },
  { id: 'in_progress', label: 'Progress' },
  { id: 'done', label: 'Done' },
  { id: 'unclassified', label: 'Unclassified' },
];

export function getFilterCount(filters: TaskFilterState) {
  return filters.groupIds.length
    + filters.assigneeIds.length
    + filters.priorityIds.length
    + filters.workflowStates.length
    + filters.tagIds.length;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function readWorkflowArray(value: unknown): TaskFilterState['workflowStates'] {
  return readStringArray(value).filter((item): item is TaskFilterState['workflowStates'][number] => (
    item === 'new' || item === 'in_progress' || item === 'done' || item === 'unclassified'
  ));
}

export function readStoredTaskFilters(storageKey: string): TaskFilterState {
  if (typeof window === 'undefined') return EMPTY_TASK_FILTERS;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return EMPTY_TASK_FILTERS;

    const parsed = JSON.parse(raw) as Partial<Record<TaskFilterKey, unknown>>;
    return {
      groupIds: readStringArray(parsed.groupIds),
      assigneeIds: readStringArray(parsed.assigneeIds),
      priorityIds: readStringArray(parsed.priorityIds),
      workflowStates: readWorkflowArray(parsed.workflowStates),
      tagIds: readStringArray(parsed.tagIds),
    };
  } catch {
    return EMPTY_TASK_FILTERS;
  }
}

export function createTagFilterId(columnId: string, optionId: string) {
  return `${columnId}::${optionId}`;
}

export function getTaskTagIds(task: Task, boardConfig: BoardConfig) {
  const tagIds: string[] = [];

  if (task.status) {
    tagIds.push(createTagFilterId('col_status', task.status));
  }

  for (const column of boardConfig.columns) {
    if (column.id === 'col_status' || (column.type !== 'singleSelect' && column.type !== 'multiSelect')) {
      continue;
    }

    const rawValue = task.values?.[column.id];
    const values = Array.isArray(rawValue)
      ? rawValue.map(String)
      : rawValue == null || rawValue === ''
        ? []
        : [String(rawValue)];

    for (const value of values) {
      tagIds.push(createTagFilterId(column.id, value));
    }
  }

  return tagIds;
}

export function getTagFilterChoices(boardConfig: BoardConfig): FilterChoice[] {
  const statusChoices = boardConfig.statusOptions.map((option) => ({
    id: createTagFilterId('col_status', option.id),
    label: option.label,
    color: option.color,
    groupLabel: 'Status',
  }));

  const customChoices = boardConfig.columns
    .filter((column) => column.id !== 'col_status' && (column.type === 'singleSelect' || column.type === 'multiSelect'))
    .flatMap((column) => (column.options ?? []).map((option) => ({
      id: createTagFilterId(column.id, option.id),
      label: option.label,
      color: option.color,
      groupLabel: column.label,
    })));

  return [...statusChoices, ...customChoices];
}

export function getAssigneeFilterChoices(tasks: Task[], users: Record<string, User>): FilterChoice[] {
  const ids = new Set<string>();
  let hasUnassigned = false;

  for (const task of tasks) {
    const assigneeIds = task.assigneeIds.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];
    if (assigneeIds.length === 0) {
      hasUnassigned = true;
      continue;
    }
    assigneeIds.forEach((id) => ids.add(id));
  }

  const choices = [...ids]
    .map((id) => ({ id, label: users[id]?.name || 'Unknown user' }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return hasUnassigned ? [{ id: UNASSIGNED_FILTER_ID, label: 'Unassigned' }, ...choices] : choices;
}

export function taskMatchesFilters(task: Task, filters: TaskFilterState, boardConfig: BoardConfig) {
  if (filters.groupIds.length > 0 && !filters.groupIds.includes(task.groupId)) {
    return false;
  }

  if (filters.priorityIds.length > 0 && !filters.priorityIds.includes(task.priority)) {
    return false;
  }

  if (filters.workflowStates.length > 0 && !filters.workflowStates.includes(resolveTaskWorkflow(task, boardConfig))) {
    return false;
  }

  if (filters.assigneeIds.length > 0) {
    const taskAssigneeIds = task.assigneeIds.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];
    const assigneeMatches = taskAssigneeIds.length === 0
      ? filters.assigneeIds.includes(UNASSIGNED_FILTER_ID)
      : taskAssigneeIds.some((id) => filters.assigneeIds.includes(id));
    if (!assigneeMatches) {
      return false;
    }
  }

  if (filters.tagIds.length > 0) {
    const taskTagIds = getTaskTagIds(task, boardConfig);
    if (!taskTagIds.some((id) => filters.tagIds.includes(id))) {
      return false;
    }
  }

  return true;
}
