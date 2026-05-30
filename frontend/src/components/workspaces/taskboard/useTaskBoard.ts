import { useContext } from 'react';
import { TaskBoardContext, type TaskBoardContextValue } from './TaskBoardContextDefinition';

export function useTaskBoard(): TaskBoardContextValue {
  const ctx = useContext(TaskBoardContext);
  if (!ctx) {
    throw new Error('useTaskBoard must be used within <TaskBoardProvider>');
  }
  return ctx;
}
