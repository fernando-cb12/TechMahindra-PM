import type {
  BoardConfig,
  ColumnDefinition,
  FileAttachment,
  SelectOption,
  Task,
  TaskGroup,
  TaskUpdate,
  User,
} from '../components/workspaces/taskboard/types';
import { apiClient } from './apiClient';
import type { AssignableUser } from './workspacesService';

export interface BoardMoveTarget {
  id: string;
  name: string;
  groups: TaskGroup[];
}

export interface BoardViewDefinition {
  id: string;
  name: string;
  type: string;
  order: number;
  isDefault: boolean;
  config: Record<string, unknown>;
}

export interface TaskBoardPayload {
  boardConfig: BoardConfig;
  groups: TaskGroup[];
  tasks: Record<string, Task>;
  users: Record<string, User>;
  availableBoards: BoardMoveTarget[];
  views: BoardViewDefinition[];
}

type UploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string; fields?: Record<string, string> } } }).response?.data;
    if (data?.error) return data.error;
    if (data?.fields) {
      const first = Object.values(data.fields)[0];
      if (first) return first;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Task board request failed';
}

export async function getTaskBoard(workspaceId: string, boardId: string): Promise<TaskBoardPayload> {
  try {
    const { data } = await apiClient.get<TaskBoardPayload>(`/api/workspaces/${workspaceId}/boards/${boardId}`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function updateBoard(
  workspaceId: string,
  boardId: string,
  payload: { name?: string }
): Promise<TaskBoardPayload> {
  try {
    const { data } = await apiClient.patch<TaskBoardPayload>(`/api/workspaces/${workspaceId}/boards/${boardId}`, payload);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function deleteBoard(workspaceId: string, boardId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/workspaces/${workspaceId}/boards/${boardId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function restoreBoard(workspaceId: string, boardId: string): Promise<TaskBoardPayload> {
  try {
    const { data } = await apiClient.post<TaskBoardPayload>(`/api/workspaces/${workspaceId}/boards/${boardId}/restore`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function addBoardMembers(
  workspaceId: string,
  boardId: string,
  userIds: number[]
): Promise<TaskBoardPayload> {
  try {
    const { data } = await apiClient.post<TaskBoardPayload>(`/api/workspaces/${workspaceId}/boards/${boardId}/members`, {
      userIds,
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getBoardMemberCandidates(workspaceId: string, boardId: string): Promise<AssignableUser[]> {
  try {
    const { data } = await apiClient.get<AssignableUser[]>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/members/candidates`
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createTaskGroup(
  workspaceId: string,
  boardId: string,
  payload: { name: string; color?: string }
): Promise<TaskGroup> {
  try {
    const { data } = await apiClient.post<TaskGroup>(`/api/workspaces/${workspaceId}/boards/${boardId}/groups`, payload);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function updateTaskGroup(
  workspaceId: string,
  boardId: string,
  groupId: string,
  payload: { name?: string; color?: string; order?: number }
): Promise<TaskGroup> {
  try {
    const { data } = await apiClient.patch<TaskGroup>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/groups/${groupId}`,
      payload
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function deleteTaskGroup(workspaceId: string, boardId: string, groupId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/groups/${groupId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function restoreTaskGroup(workspaceId: string, boardId: string, groupId: string): Promise<TaskGroup> {
  try {
    const { data } = await apiClient.post<TaskGroup>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/groups/${groupId}/restore`
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function moveTaskGroup(
  workspaceId: string,
  boardId: string,
  groupId: string,
  payload: { toBoardId: string; position?: number }
): Promise<void> {
  try {
    await apiClient.put(`/api/workspaces/${workspaceId}/boards/${boardId}/groups/${groupId}/move`, {
      toBoardId: Number(payload.toBoardId),
      position: payload.position,
    });
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createTask(
  workspaceId: string,
  boardId: string,
  groupId: string,
  payload: { name: string; priority?: string; dueDate?: string | null }
): Promise<Task> {
  try {
    const { data } = await apiClient.post<Task>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/groups/${groupId}/tasks`,
      payload
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function patchTask(
  workspaceId: string,
  boardId: string,
  taskId: string,
  patch: Partial<Task>
): Promise<Task> {
  try {
    const { data } = await apiClient.patch<Task>(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`, patch);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function deleteTask(workspaceId: string, boardId: string, taskId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function restoreTask(workspaceId: string, boardId: string, taskId: string): Promise<Task> {
  try {
    const { data } = await apiClient.post<Task>(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/restore`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function moveTask(
  workspaceId: string,
  boardId: string,
  taskId: string,
  payload: { toBoardId: string; toGroupId: string; position?: number }
): Promise<void> {
  try {
    await apiClient.put(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/move`, {
      toBoardId: Number(payload.toBoardId),
      toGroupId: Number(payload.toGroupId),
      position: payload.position,
    });
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createColumn(
  workspaceId: string,
  boardId: string,
  column: ColumnDefinition
): Promise<ColumnDefinition> {
  try {
    const { data } = await apiClient.post<ColumnDefinition>(`/api/workspaces/${workspaceId}/boards/${boardId}/columns`, {
      label: column.label,
      type: column.type,
      width: column.width,
      visible: column.isVisible,
      order: column.order,
      options: column.options ?? [],
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function replaceColumns(
  workspaceId: string,
  boardId: string,
  columns: ColumnDefinition[]
): Promise<ColumnDefinition[]> {
  try {
    const { data } = await apiClient.put<ColumnDefinition[]>(`/api/workspaces/${workspaceId}/boards/${boardId}/columns`, columns.map((column) => ({
      id: column.id,
      label: column.label,
      type: column.type,
      width: column.width,
      visible: column.isVisible,
      order: column.order,
      options: column.options ?? [],
    })));
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function createTaskUpdate(
  workspaceId: string,
  boardId: string,
  taskId: string,
  payload: { content: string; mentions: string[]; attachments: FileAttachment[] }
) : Promise<TaskUpdate> {
  try {
    const { data } = await apiClient.post<TaskUpdate>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/updates`,
      {
        content: payload.content,
        mentions: payload.mentions,
        attachments: payload.attachments.map((file) => ({
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
        })),
      }
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function updateTaskUpdate(
  workspaceId: string,
  boardId: string,
  taskId: string,
  updateId: string,
  payload: { content: string; mentions: string[] }
): Promise<TaskUpdate> {
  try {
    const { data } = await apiClient.patch<TaskUpdate>(
      `/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/updates/${updateId}`,
      payload
    );
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function uploadTaskUpdateFile(
  workspaceId: string,
  boardId: string,
  taskId: string,
  file: File
): Promise<{ publicUrl: string; key: string }> {
  try {
    const contentType = file.type || 'application/octet-stream';
    const { data } = await apiClient.post<UploadResponse>(
      `/api/uploads/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/updates/presign`,
      {
        fileName: file.name,
        contentType,
        sizeBytes: file.size,
      }
    );
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Upload to S3 failed');
    }
    return { publicUrl: data.publicUrl, key: data.key };
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export type { SelectOption };

