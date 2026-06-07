import type {
  WorkspaceMemberData,
  WorkspaceProjectCardData,
  WorkspaceProjectStatus,
} from '../components/workspaces/WorkspaceProjectCard';
import { apiClient } from './apiClient';
import { uploadWorkspaceBanner } from './uploadsService';

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
  bannerFile?: File | null;
  status: WorkspaceProjectStatus;
};

export type WorkspaceBoard = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type CreateBoardPayload = {
  name?: string;
  description?: string;
  color?: string;
};

type WorkspaceProjectCardApi = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  members: string[];
  memberDetails?: WorkspaceMemberData[];
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
    memberDetails: api.memberDetails ?? [],
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
    const { data } = await apiClient.get<WorkspaceProjectCardApi[]>('/api/workspaces');
    return data.map(mapCard);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceProjectCardData> {
  try {
    const { data } = await apiClient.get<WorkspaceProjectCardApi>(`/api/workspaces/${workspaceId}`);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getWorkspaceBoards(workspaceId: string): Promise<WorkspaceBoard[]> {
  try {
    const { data } = await apiClient.get<WorkspaceBoard[]>(`/api/workspaces/${workspaceId}/boards`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createWorkspaceBoard(workspaceId: string, payload: CreateBoardPayload = {}): Promise<WorkspaceBoard> {
  try {
    const { data } = await apiClient.post<WorkspaceBoard>(`/api/workspaces/${workspaceId}/boards`, payload);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function addWorkspaceMembers(workspaceId: string, userIds: number[]): Promise<WorkspaceProjectCardData> {
  try {
    const { data } = await apiClient.post<WorkspaceProjectCardApi>(`/api/workspaces/${workspaceId}/members`, { userIds });
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceProjectCardData> {
  try {
    const { data } = await apiClient.delete<WorkspaceProjectCardApi>(`/api/workspaces/${workspaceId}/members/${userId}`);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function updateWorkspaceProject(
  workspaceId: string,
  payload: Partial<Pick<CreateWorkspaceProjectPayload, 'title' | 'description' | 'dueDate' | 'budgetLabel' | 'imageUrl' | 'status'>>
): Promise<WorkspaceProjectCardData> {
  try {
    const { data } = await apiClient.patch<WorkspaceProjectCardApi>(`/api/workspaces/${workspaceId}`, payload);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function deleteWorkspaceProject(workspaceId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/workspaces/${workspaceId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function restoreWorkspaceProject(workspaceId: string): Promise<WorkspaceProjectCardData> {
  try {
    const { data } = await apiClient.post<WorkspaceProjectCardApi>(`/api/workspaces/${workspaceId}/restore`);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getAssignableWorkspaceUsers(): Promise<AssignableUser[]> {
  try {
    const { data } = await apiClient.get<AssignableUser[]>('/api/workspaces/assignable-users');
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createWorkspaceProject(
  payload: CreateWorkspaceProjectPayload
): Promise<WorkspaceProjectCardData> {
  try {
    const uploadedImageUrl = payload.bannerFile ? await uploadWorkspaceBanner(payload.bannerFile) : undefined;
    const body = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      memberUserIds: payload.memberUserIds,
      dueDate: payload.dueDate?.trim() || undefined,
      budgetLabel: payload.budgetLabel?.trim() || undefined,
      imageUrl: uploadedImageUrl ?? payload.imageUrl?.trim() ?? undefined,
      status: payload.status,
    };
    const { data } = await apiClient.post<WorkspaceProjectCardApi>('/api/workspaces', body);
    return mapCard(data);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}
