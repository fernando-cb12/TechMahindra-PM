import { apiClient } from './apiClient';
import type { MyTasksFilterMode } from '../components/my-tasks/types';

export type UserPreferences = {
  myTasks?: {
    filterMode?: MyTasksFilterMode;
  };
};

function isMyTasksFilterMode(value: unknown): value is MyTasksFilterMode {
  return value === 'kpis' || value === 'filters';
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const response = await apiClient.get<UserPreferences>('/api/users/me/preferences');
  const filterMode = response.data.myTasks?.filterMode;
  return {
    ...response.data,
    myTasks: {
      ...response.data.myTasks,
      filterMode: isMyTasksFilterMode(filterMode) ? filterMode : undefined,
    },
  };
}

export async function updateMyTasksFilterMode(filterMode: MyTasksFilterMode): Promise<UserPreferences> {
  const response = await apiClient.patch<UserPreferences>('/api/users/me/preferences', {
    myTasks: { filterMode },
  });
  return response.data;
}
