import type { MyTaskListItem } from '../../services/myTasksService';
import { myTasksDateUtils } from '../../services/myTasksService';
import { WORKFLOW_MEANING_LABELS } from '../workspaces/taskboard/workflow';
import type { DueDateFilterId, FilterChoice, MyTasksFilters, MyTasksSummary } from './types';

export const DUE_DATE_FILTER_CHOICES: FilterChoice[] = [
  { id: 'overdue', label: 'Overdue', color: '#D92D20' },
  { id: 'dueSoon', label: 'Due soon', color: '#F79009' },
  { id: 'future', label: 'Future', color: '#2E90FA' },
  { id: 'noDate', label: 'No date', color: '#667085' },
  { id: 'completed', label: 'Completed', color: '#12B76A' },
];

export function formatDueDate(value: string | null) {
  if (!value) return 'No date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value || 0));
}

export function getWorkflowLabel(workflow: MyTaskListItem['workflow']) {
  if (workflow === 'unclassified' || workflow === 'none') return 'Open';
  return WORKFLOW_MEANING_LABELS[workflow];
}

export function getTaskLink(task: MyTaskListItem) {
  return `/workspaces/${task.workspaceId}/boards/${task.boardId}?task=${task.id}`;
}

export function countFilters(filters: MyTasksFilters) {
  return filters.workspaceIds.length
    + filters.boardIds.length
    + filters.priorities.length
    + filters.workflows.length
    + filters.dueDates.length;
}

export function buildMyTasksSummary(tasks: MyTaskListItem[]): MyTasksSummary {
  return {
    assigned: tasks.length,
    open: tasks.filter((task) => task.workflow !== 'done').length,
    inProgress: tasks.filter((task) => task.workflow === 'in_progress').length,
    dueSoon: tasks.filter((task) => task.workflow !== 'done' && myTasksDateUtils.isDueSoon(task.dueDate)).length,
    overdue: tasks.filter((task) => task.workflow !== 'done' && myTasksDateUtils.isBeforeToday(task.dueDate)).length,
    completed: tasks.filter((task) => task.workflow === 'done').length,
    stale: tasks.filter((task) => task.workflow !== 'done' && myTasksDateUtils.isStale(task.updatedAt)).length,
  };
}

export function uniqueChoices<T extends string>(
  tasks: MyTaskListItem[],
  getId: (task: MyTaskListItem) => T,
  getLabel: (task: MyTaskListItem) => string,
  getColor?: (task: MyTaskListItem) => string | undefined,
  getGroup?: (task: MyTaskListItem) => string | undefined
): FilterChoice[] {
  const map = new Map<string, FilterChoice>();
  for (const task of tasks) {
    const id = getId(task);
    if (!map.has(id)) {
      map.set(id, {
        id,
        label: getLabel(task),
        color: getColor?.(task),
        groupLabel: getGroup?.(task),
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const groupCompare = (a.groupLabel ?? '').localeCompare(b.groupLabel ?? '');
    return groupCompare || a.label.localeCompare(b.label);
  });
}

export function taskMatchesInsight(task: MyTaskListItem, insightId: string | null) {
  if (!insightId || insightId === 'assigned') return true;
  if (insightId === 'open') return task.workflow !== 'done';
  if (insightId === 'inProgress') return task.workflow === 'in_progress';
  if (insightId === 'dueSoon') return task.workflow !== 'done' && myTasksDateUtils.isDueSoon(task.dueDate);
  if (insightId === 'overdue') return task.workflow !== 'done' && myTasksDateUtils.isBeforeToday(task.dueDate);
  if (insightId === 'completed') return task.workflow === 'done';
  if (insightId === 'stale') return task.workflow !== 'done' && myTasksDateUtils.isStale(task.updatedAt);
  return true;
}

export function taskMatchesSearch(task: MyTaskListItem, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;
  return [
    task.name,
    task.workspaceName,
    task.boardName,
    task.groupName,
    task.statusLabel,
    task.priorityLabel,
  ].join(' ').toLowerCase().includes(query);
}

export function taskMatchesFilters(task: MyTaskListItem, filters: MyTasksFilters) {
  return (filters.workspaceIds.length === 0 || filters.workspaceIds.includes(task.workspaceId))
    && (filters.boardIds.length === 0 || filters.boardIds.includes(task.boardId))
    && (filters.priorities.length === 0 || filters.priorities.includes(task.priority))
    && (filters.workflows.length === 0 || filters.workflows.includes(task.workflow))
    && (filters.dueDates.length === 0 || filters.dueDates.some((bucket) => taskMatchesDueDateBucket(task, bucket)));
}

export function taskMatchesDueDateBucket(task: MyTaskListItem, bucket: DueDateFilterId) {
  if (bucket === 'completed') return task.workflow === 'done';
  if (bucket === 'noDate') return !task.dueDate;
  if (task.workflow === 'done') return false;
  if (bucket === 'overdue') return myTasksDateUtils.isBeforeToday(task.dueDate);
  if (bucket === 'dueSoon') return myTasksDateUtils.isDueSoon(task.dueDate);
  if (bucket === 'future') {
    return Boolean(task.dueDate)
      && !myTasksDateUtils.isBeforeToday(task.dueDate)
      && !myTasksDateUtils.isDueSoon(task.dueDate);
  }
  return true;
}
