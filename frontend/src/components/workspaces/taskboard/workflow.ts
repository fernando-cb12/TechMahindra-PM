import type { BoardConfig, Task, WorkflowMeaning } from './types';

export type ResolvedWorkflowState = WorkflowMeaning | 'unclassified';

export const WORKFLOW_MEANING_OPTIONS: { value: Exclude<WorkflowMeaning, 'none'>; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const WORKFLOW_MEANING_LABELS: Record<Exclude<WorkflowMeaning, 'none'>, string> = {
  new: 'New',
  in_progress: 'Progress',
  done: 'Done',
};

export function supportsWorkflowMeaning(columnType: string) {
  return columnType === 'status' || columnType === 'singleSelect' || columnType === 'multiSelect';
}

export function normalizeWorkflowMeaning(value: unknown): WorkflowMeaning {
  return value === 'new' || value === 'in_progress' || value === 'done' ? value : 'none';
}

export function resolveTaskWorkflow(task: Task, boardConfig: BoardConfig): ResolvedWorkflowState {
  const meanings: WorkflowMeaning[] = [];

  const statusMeaning = boardConfig.statusOptions.find((option) => option.id === task.status)?.workflowMeaning;
  meanings.push(normalizeWorkflowMeaning(statusMeaning));

  for (const column of boardConfig.columns) {
    if (!supportsWorkflowMeaning(column.type) || column.id === 'col_status') {
      continue;
    }

    const rawValue = task.values?.[column.id];
    const values = Array.isArray(rawValue)
      ? rawValue.map(String)
      : rawValue == null || rawValue === ''
        ? []
        : [String(rawValue)];

    for (const value of values) {
      const meaning = column.options?.find((option) => option.id === value)?.workflowMeaning;
      meanings.push(normalizeWorkflowMeaning(meaning));
    }
  }

  if (meanings.includes('done')) return 'done';
  if (meanings.includes('in_progress')) return 'in_progress';
  if (meanings.includes('new')) return 'new';
  return 'unclassified';
}
