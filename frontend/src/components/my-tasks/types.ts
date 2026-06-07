import type { MyTaskListItem } from '../../services/myTasksService';

export type InsightId = 'assigned' | 'open' | 'inProgress' | 'dueSoon' | 'overdue' | 'completed' | 'stale';
export type MyTasksFilterMode = 'kpis' | 'filters';
export type DueDateFilterId = 'noDate' | 'dueSoon' | 'overdue' | 'future' | 'completed';

export type MyTasksFilters = {
  workspaceIds: string[];
  boardIds: string[];
  personIds: string[];
  priorities: string[];
  workflows: string[];
  dueDates: DueDateFilterId[];
};

export type FilterChoice = {
  id: string;
  label: string;
  color?: string;
  groupLabel?: string;
};

export type MyTasksSummary = Record<InsightId, number>;

export type TaskMenuState = {
  taskId: string;
  anchor?: HTMLElement;
  position?: { mouseX: number; mouseY: number };
} | null;

export type MyTaskWorkflow = MyTaskListItem['workflow'];

export const EMPTY_MY_TASKS_FILTERS: MyTasksFilters = {
  workspaceIds: [],
  boardIds: [],
  personIds: [],
  priorities: [],
  workflows: [],
  dueDates: [],
};
