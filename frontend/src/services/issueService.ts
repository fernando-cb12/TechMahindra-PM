import type { IssueCardProps } from '../components/issue/types';

export type CreateIssuePayload = {
  project: string;
  workspaceId: string;
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
    workspaceId: '1',
    assignee: 'Luis Mares',
    priority: 'high',
    status: 'To Do',
  },
  {
    issueKey: 'APP-102',
    summary: 'Implement new design system',
    project: 'Project Pulse',
    workspaceId: '2',
    assignee: 'Marco Ibarra',
    priority: 'medium',
    status: 'To Do',
  },
  {
    issueKey: 'APP-103',
    summary: 'Redesign login screen',
    project: 'Project Alpha',
    workspaceId: '1',
    assignee: 'Antonio Calderon',
    priority: 'high',
    status: 'In Progress',
  },
  {
    issueKey: 'APP-104',
    summary: 'Refactor navigation structure',
    project: 'Project Nova',
    workspaceId: '3',
    assignee: 'Fernando Camou',
    priority: 'low',
    status: 'Done',
  },
  {
    issueKey: 'APP-105',
    summary: 'Update API documentation',
    project: 'Project Pulse',
    workspaceId: '2',
    assignee: 'Priya Nair',
    priority: 'medium',
    status: 'In Progress',
  },
];

/**
 * Service layer for issues.
 *
 * When backend endpoints are ready, replace each function body
 * with API calls and keep the same function contracts.
 */
export async function getIssues(workspaceId?: string): Promise<IssueCardProps[]> {
  // TODO: Replace with API call, e.g. GET /api/issues or /api/workspaces/:id/issues
  const all = [...MOCK_ISSUES];
  if (!workspaceId) {
    return Promise.resolve(all);
  }
  return Promise.resolve(all.filter((issue) => issue.workspaceId === workspaceId));
}

export async function createIssue(payload: CreateIssuePayload): Promise<IssueCardProps> {
  // TODO: Replace with API call
  const newIssue: IssueCardProps = {
    issueKey: `APP-${Math.floor(Math.random() * 900) + 100}`,
    project: payload.project,
    workspaceId: payload.workspaceId,
    summary: payload.summary,
    assignee: payload.assignee || 'Unassigned',
    priority: payload.priority,
    status: payload.status ?? 'To Do',
  };

  MOCK_ISSUES.unshift(newIssue);
  return Promise.resolve(newIssue);
}
