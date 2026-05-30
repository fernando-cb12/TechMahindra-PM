import { useContext } from 'react';
import { DashboardContext, type DashboardContextValue } from './DashboardContextDefinition';

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>');
  return ctx;
}
