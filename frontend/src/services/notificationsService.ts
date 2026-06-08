import { apiClient } from './apiClient';

export interface AppInboxNotification {
  id: string;
  eventType: string;
  title: string;
  body: string;
  linkPath?: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt?: string | null;
  emailStatus: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export async function getNotifications(): Promise<AppInboxNotification[]> {
  const { data } = await apiClient.get<AppInboxNotification[]>('/api/notifications');
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/api/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<AppInboxNotification> {
  const { data } = await apiClient.patch<AppInboxNotification>(`/api/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await apiClient.patch<{ count: number }>('/api/notifications/read-all');
  return data.count;
}
