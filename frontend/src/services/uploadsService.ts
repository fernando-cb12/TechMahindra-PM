import { apiClient } from './apiClient';

type UploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error) return data.error;
  }
  if (err instanceof Error) return err.message;
  return 'Upload failed';
}

export async function uploadWorkspaceBanner(file: File): Promise<string> {
  try {
    const contentType = file.type || 'application/octet-stream';
    const { data } = await apiClient.post<UploadResponse>('/api/uploads/workspace-banner/presign', {
      fileName: file.name,
      contentType,
    });
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Upload to S3 failed');
    }
    return data.publicUrl;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}
