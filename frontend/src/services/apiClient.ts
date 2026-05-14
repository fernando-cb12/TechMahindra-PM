import axios from 'axios';
import { loadSession } from '../auth/auth';

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
