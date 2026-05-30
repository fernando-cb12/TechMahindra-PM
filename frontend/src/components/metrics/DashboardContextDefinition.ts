import { createContext } from 'react';
import type { Card, ChartType, DashboardState, Metric } from './types';

export interface DashboardContextValue extends DashboardState {
  metrics: Metric[];
  hasUnsavedChanges: boolean;
  toggleEditMode: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  addCard: (metricId: string, chartType: ChartType) => void;
  removeCard: (cardId: string) => void;
  updateLayouts: (updated: Card[]) => void;
  confirmEdit: () => void;
  discardChanges: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);
