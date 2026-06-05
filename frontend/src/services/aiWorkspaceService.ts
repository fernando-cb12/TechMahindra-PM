import { apiClient } from './apiClient';

type UploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export type DraftTask = {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  dueDate: string | null;
};

export type DraftGroup = {
  name: string;
  tasks: DraftTask[];
};

export type DraftBoard = {
  name: string;
  description: string;
  groups: DraftGroup[];
};

export type AiWorkspaceDraft = {
  id: string;
  workspace: {
    title: string;
    description: string;
    dueDate: string | null;
    budgetLabel: string;
  };
  boards: DraftBoard[];
  sourceFileName?: string | null;
};

export type AiWorkspaceApproveResponse = {
  workspaceId: string;
  firstBoardId: string | null;
};

export type AiWorkspaceMode = 'EXTRACTION' | 'GENERATION';

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
  return 'AI workspace request failed';
}

export async function uploadAiWorkspacePdf(file: File): Promise<{ key: string }> {
  try {
    const contentType = file.type || 'application/pdf';
    const { data } = await apiClient.post<UploadResponse>('/api/uploads/ai-imports/presign', {
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    });
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Upload to S3 failed');
    }
    return { key: data.key };
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function processAiWorkspacePdf(file: File, mode: AiWorkspaceMode): Promise<AiWorkspaceDraft> {
  try {
    const { key } = await uploadAiWorkspacePdf(file);
    const { data } = await apiClient.post<AiWorkspaceDraft>('/api/ai/workspace-imports/process', {
      key,
      fileName: file.name,
      mode,
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function getAiWorkspaceDraft(draftId: string): Promise<AiWorkspaceDraft> {
  try {
    const { data } = await apiClient.get<AiWorkspaceDraft>(`/api/ai/workspace-imports/${draftId}`);
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function approveAiWorkspaceDraft(draft: AiWorkspaceDraft): Promise<AiWorkspaceApproveResponse> {
  try {
    const { data } = await apiClient.post<AiWorkspaceApproveResponse>('/api/ai/workspace-imports/approve', {
      draft,
      memberUserIds: [],
      status: 'planning',
    });
    return data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function discardAiWorkspaceDraft(draftId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/ai/workspace-imports/${draftId}`);
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}
