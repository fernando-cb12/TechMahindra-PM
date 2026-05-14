import type { WorkspaceProjectCardData, WorkspaceProjectStatus } from '../components/workspaces/WorkspaceProjectCard';
import { apiClient } from './apiClient';

export type AssignableUser = {
  id: number;
  name: string;
  email: string;
};

export type CreateWorkspaceProjectPayload = {
  title: string;
  description: string;
  memberUserIds: number[];
  dueDate: string;
  budgetLabel: string;
  imageUrl?: string;
  status: WorkspaceProjectStatus;
};

type WorkspaceProjectCardApi = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  members: string[];
  currentProgress: number;
  estimatedProgress: number;
  dueDate: string;
  budgetLabel: string;
  status: WorkspaceProjectStatus;
};

function mapCard(api: WorkspaceProjectCardApi): WorkspaceProjectCardData {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    imageUrl: api.imageUrl ?? undefined,
    members: api.members,
    currentProgress: api.currentProgress,
    estimatedProgress: api.estimatedProgress,
    dueDate: api.dueDate,
    budgetLabel: api.budgetLabel,
    status: api.status,
  };
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string; fields?: Record<string, string> } } }).response
      ?.data;
    if (data?.error) return data.error;
    if (data?.fields && typeof data.fields === 'object') {
      const first = Object.values(data.fields)[0];
      if (first) return first;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export async function getWorkspaceProjects(): Promise<WorkspaceProjectCardData[]> {
  try {
    const { data } = await apiClient.get<WorkspaceProjectCardApi[]>('/api/workspace-projects');
    return data.map(mapCard);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getAssignableWorkspaceUsers(): Promise<AssignableUser[]> {
  try {
    const { data } = await apiClient.get<AssignableUser[]>('/api/workspace-projects/assignable-users');
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createWorkspaceProject(
  payload: CreateWorkspaceProjectPayload
): Promise<WorkspaceProjectCardData> {
  try {
    const body = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      memberUserIds: payload.memberUserIds,
      dueDate: payload.dueDate?.trim() || undefined,
      budgetLabel: payload.budgetLabel?.trim() || undefined,
      imageUrl: payload.imageUrl?.trim() || undefined,
      status: payload.status,
    };
    const { data } = await apiClient.post<WorkspaceProjectCardApi>('/api/workspace-projects', body);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}
