import axios from 'axios';
import { loadSession } from '../auth/auth';
import { showAppNotification } from '../components/shared/appNotifications';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.accessToken) {
    const type = session.tokenType?.trim() || 'Bearer';
    config.headers.Authorization = `${type} ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : error instanceof Error
          ? error.message
          : 'Request failed';

    showAppNotification({ message, severity: 'error' });
    return Promise.reject(error);
  }
);
