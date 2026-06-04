import type { IssueCardProps } from '../components/issue/types';
import { getTaskBoard } from './taskBoardService';
import { getWorkspaceBoards } from './workspacesService';

export type WorkspaceIssuePriority = 'high' | 'medium' | 'low' | 'critical';
export type WorkspaceIssueStatus = 'open' | 'in-progress' | 'closed' | 'on-hold';

export type WorkspaceIssueSummary = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeAvatarUrl?: string | null;
  priority: WorkspaceIssuePriority;
  status: WorkspaceIssueStatus;
  boardId: string;
  boardName: string;
};

export type CreateIssuePayload = {
  project: string;
  summary: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status?: string;
};

const MOCK_ISSUES: IssueCardProps[] = [
  {
    issueKey: 'APP-101',
    summary: 'Audit current UI components',
    project: 'Project Alpha',
    assignee: 'Luis Mares',
    priority: 'high',
    status: 'To Do',
  },
  {
    issueKey: 'APP-102',
    summary: 'Implement new design system',
    project: 'Project Pulse',
    assignee: 'Marco Ibarra',
    priority: 'medium',
    status: 'To Do',
  },
  {
    issueKey: 'APP-103',
    summary: 'Redesign login screen',
    project: 'Project Alpha',
    assignee: 'Antonio Calderon',
    priority: 'high',
    status: 'In Progress',
  },
  {
    issueKey: 'APP-104',
    summary: 'Refactor navigation structure',
    project: 'Project Nova',
    assignee: 'Fernando Camou',
    priority: 'low',
    status: 'Done',
  },
];

export async function getIssues(): Promise<IssueCardProps[]> {
  return Promise.resolve(MOCK_ISSUES);
}

export async function createIssue(payload: CreateIssuePayload): Promise<IssueCardProps> {
  const newIssue: IssueCardProps = {
    issueKey: `APP-${Math.floor(Math.random() * 900) + 100}`,
    project: payload.project,
    summary: payload.summary,
    assignee: payload.assignee || 'Unassigned',
    priority: payload.priority,
    status: payload.status ?? 'To Do',
  };

  MOCK_ISSUES.unshift(newIssue);
  return Promise.resolve(newIssue);
}

function normalizePriority(key: string, label: string): WorkspaceIssuePriority {
  const value = `${key} ${label}`.toLowerCase();
  if (value.includes('critical') || value.includes('urgent')) return 'critical';
  if (value.includes('high')) return 'high';
  if (value.includes('low')) return 'low';
  return 'medium';
}

function normalizeStatus(key: string, label: string, workflowMeaning?: string): WorkspaceIssueStatus {
  const value = `${key} ${label}`.toLowerCase();
  if (workflowMeaning === 'done' || value.includes('done') || value.includes('closed') || value.includes('resolved')) {
    return 'closed';
  }
  if (workflowMeaning === 'in_progress' || value.includes('progress') || value.includes('doing')) {
    return 'in-progress';
  }
  if (value.includes('hold') || value.includes('blocked') || value.includes('pause')) {
    return 'on-hold';
  }
  return 'open';
}

export async function getWorkspaceIssues(workspaceId: string): Promise<WorkspaceIssueSummary[]> {
  const boards = await getWorkspaceBoards(workspaceId);
  const payloads = await Promise.all(
    boards.map(async (board) => ({
      board,
      payload: await getTaskBoard(workspaceId, board.id),
    })),
  );

  return payloads
    .flatMap(({ board, payload }) => {
      const statusOptions = new Map(payload.boardConfig.statusOptions.map((option) => [option.id, option]));
      const priorityOptions = new Map(payload.boardConfig.priorityOptions.map((option) => [option.id, option]));
      const groupNames = new Map(payload.groups.map((group) => [group.id, group.name]));

      return Object.values(payload.tasks).map((task) => {
        const assigneeId = task.assigneeIds[0] ?? task.assigneeId;
        const assignee = assigneeId ? payload.users[assigneeId]?.name ?? 'Unassigned' : 'Unassigned';
        const assigneeAvatarUrl = assigneeId ? payload.users[assigneeId]?.avatarUrl ?? null : null;
        const groupName = groupNames.get(task.groupId);
        const statusOption = statusOptions.get(task.status);
        const priorityOption = priorityOptions.get(task.priority);
        const dueDateLabel = task.dueDate ? ` • Due ${task.dueDate}` : '';

        return {
          id: task.id,
          title: task.name,
          description: `${board.name}${groupName ? ` • ${groupName}` : ''}${dueDateLabel}`,
          assignee,
          assigneeAvatarUrl,
          priority: normalizePriority(task.priority, priorityOption?.label ?? ''),
          status: normalizeStatus(task.status, statusOption?.label ?? '', statusOption?.workflowMeaning),
          boardId: board.id,
          boardName: board.name,
        } satisfies WorkspaceIssueSummary;
      });
    })
    .sort((left, right) => right.id.localeCompare(left.id, undefined, { numeric: true }));
}
