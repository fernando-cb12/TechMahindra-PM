import type { FileAttachment, TaskActivity, TaskUpdate } from '../components/workspaces/taskboard/types';
import type { ResolvedWorkflowState } from '../components/workspaces/taskboard/workflow';
import { apiClient } from './apiClient';

export type MyTaskListItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  boardId: string;
  boardName: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  name: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  workflow: ResolvedWorkflowState;
  priority: string;
  priorityLabel: string;
  priorityColor: string;
  dueDate: string | null;
  progress: number;
  updates: TaskUpdate[];
  files: FileAttachment[];
  activities: TaskActivity[];
  createdAt: string;
  updatedAt: string;
};

export type MyTasksSummary = {
  assigned: number;
  open: number;
  inProgress: number;
  dueSoon: number;
  overdue: number;
  completed: number;
  stale: number;
};

export type MyTasksResponse = {
  items: MyTaskListItem[];
  summary: MyTasksSummary;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isBeforeToday(date: string | null) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${date}T00:00:00`).getTime() < today.getTime();
}

function isDueSoon(date: string | null) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`).getTime();
  const diff = due - today.getTime();
  return diff >= 0 && diff <= 7 * DAY_MS;
}

function isStale(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(updated) && Date.now() - updated > 7 * DAY_MS;
}

export async function getMyTasks(): Promise<MyTasksResponse> {
  const { data } = await apiClient.get<MyTasksResponse>('/api/tasks/my');
  return data;
}

export const myTasksDateUtils = {
  isBeforeToday,
  isDueSoon,
  isStale,
};
