import type { IssueCardProps } from '../components/issue/types';

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

/**
 * Service layer for issues.
 *
 * This file is the only place that knows about mock data.
 * When backend endpoints are ready, replace each function body
 * with API calls and keep the same function contracts.
 */
export async function getIssues(): Promise<IssueCardProps[]> {
  // TODO: Replace with API call, e.g. return (await apiClient.get('/api/issues')).data;
  return Promise.resolve(MOCK_ISSUES);
}

export async function createIssue(payload: CreateIssuePayload): Promise<IssueCardProps> {
  // TODO: Replace with API call, e.g. return (await apiClient.post('/api/issues', payload)).data;
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
