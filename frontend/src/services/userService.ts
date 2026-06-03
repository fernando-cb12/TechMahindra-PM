import { apiClient } from './apiClient';
import { uploadProfilePhoto } from './uploadsService';

export type NotificationSettings = {
  issuesAssigned: boolean;
  mentions: boolean;
  projectUpdates: boolean;
  dailySummary: boolean;
};

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  timezone: string;
  avatarUrl: string | null;
  notifications: NotificationSettings;
};

export type UpdateUserProfilePayload = {
  name: string;
  timezone: string;
  avatarUrl?: string | null;
  avatarFile?: File | null;
  notifications: NotificationSettings;
};

type UserProfileApi = {
  id: number;
  name: string;
  email: string;
  role: string;
  timezone: string;
  avatarUrl: string | null;
  notifications?: Partial<NotificationSettings>;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  issuesAssigned: true,
  mentions: true,
  projectUpdates: true,
  dailySummary: true,
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
  return 'Profile request failed';
}

function mapProfile(data: UserProfileApi): UserProfile {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    timezone: data.timezone,
    avatarUrl: data.avatarUrl ?? null,
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...data.notifications,
    },
  };
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const { data } = await apiClient.get<UserProfileApi>('/api/users/me');
    return mapProfile(data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateUserProfile(profile: UpdateUserProfilePayload): Promise<UserProfile> {
  try {
    const avatarUrl = profile.avatarFile ? await uploadProfilePhoto(profile.avatarFile) : profile.avatarUrl;
    const { data } = await apiClient.patch<UserProfileApi>('/api/users/me', {
      name: profile.name.trim(),
      timezone: profile.timezone.trim(),
      avatarUrl: avatarUrl ?? null,
      notifications: profile.notifications,
    });
    return mapProfile(data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
