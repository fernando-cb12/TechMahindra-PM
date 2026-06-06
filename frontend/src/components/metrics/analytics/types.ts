import type { MetricWidgetConfig } from '../../../services/metricsService';

export type GlobalFilters = {
  workspaceIds: string[];
  boardIds: string[];
  dateFrom: string;
  dateTo: string;
  workflow: string;
  priority: string;
  assigneeId: string;
  dueDateState: string;
};

export type DrilldownTask = {
  taskId: string | number;
  title?: string;
  workspaceId?: string | number;
  workspaceName?: string;
  boardId?: string | number;
  boardName?: string;
  status?: string;
  workflow?: string;
  priority?: string;
  assignees?: string;
  dueDate?: string;
  updatedAt?: string;
  progress?: number;
  budget?: number;
  customValue?: string;
};

export type DrilldownState = {
  widgetConfig: MetricWidgetConfig;
  segmentLabel?: string;
};

export const DEFAULT_FILTERS: GlobalFilters = {
  workspaceIds: [],
  boardIds: [],
  dateFrom: '',
  dateTo: '',
  workflow: '',
  priority: '',
  assigneeId: '',
  dueDateState: '',
};

export function cleanFilters(filters: GlobalFilters): Record<string, unknown> {
  return {
    ...(filters.workflow ? { workflow: filters.workflow } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.dueDateState ? { dueDateState: filters.dueDateState } : {}),
  };
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function formatDateTime(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
