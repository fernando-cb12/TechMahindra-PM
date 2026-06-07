import type { WorkspaceProjectStatus } from './WorkspaceProjectCard';

export const WORKSPACE_STATUS_OPTIONS: Array<{ value: WorkspaceProjectStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

export function getWorkspaceStatusLabel(status: WorkspaceProjectStatus): string {
  return WORKSPACE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Planning';
}
