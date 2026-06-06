import { apiClient } from './apiClient';
import type { Metric } from '../components/metrics/types';
import { MOCK_METRICS } from '../mocks/metrics';

export type MetricDefinition = {
  id: string;
  label: string;
  description: string;
  compatibleDimensions: string[];
  compatibleVisualizations: string[];
};

export type MetricDimension = {
  id: string;
  label: string;
  type: string;
};

export type MetricCustomField = {
  workspaceId?: string;
  workspaceName?: string;
  boardId: string;
  boardName?: string;
  key: string;
  label: string;
  type: string;
  canMeasure: boolean;
  canDimension: boolean;
  canFilter: boolean;
};

export type MetricSemanticField = {
  semanticKey: 'budget' | 'progress' | 'due_date' | 'priority' | 'effort';
  label: string;
  boardId: string;
  boardName: string;
  workspaceId: string;
  workspaceName: string;
  missing: boolean;
  sourceType: 'core_field' | 'custom_field';
  sourceKey: string;
  sourceLabel: string;
};

export type MetricCatalogUser = {
  id: string;
  name: string;
  email: string;
};

export type MetricCatalog = {
  metrics: MetricDefinition[];
  dimensions: MetricDimension[];
  customFields: MetricCustomField[];
  assignees: MetricCatalogUser[];
  warnings: string[];
  semanticFields: MetricSemanticField[];
};

export type MetricDashboardConfig = {
  filters?: {
    workspaceIds?: string[];
    boardIds?: string[];
    dateRange?: string;
    dateFrom?: string;
    dateTo?: string;
    workflow?: string;
    priority?: string;
    assigneeId?: string;
    dueDateState?: string;
  };
  widgets?: MetricWidgetConfig[];
};

export type MetricWidgetConfig = {
  id: string;
  title: string;
  metric: string;
  dimension: string;
  visualization: 'kpi' | 'bar' | 'line' | 'timeline' | 'table' | 'pie';
  customFieldKey?: string;
  aggregation?: 'count' | 'sum' | 'avg';
  includeComparison?: boolean;
  layout: { x: number; y: number; w: number; h: number };
};

export type MetricDashboardRecord = {
  id: string;
  name: string;
  scopeType: 'global' | 'workspace' | 'board';
  scopeId: string | null;
  isDefault: boolean;
  visibility: 'private' | 'shared';
  config: MetricDashboardConfig;
  createdAt: string;
  updatedAt: string;
};

export type MetricPresetOverrideRecord = {
  presetId: string;
  config: MetricDashboardConfig;
  createdAt: string;
  updatedAt: string;
};

export type MetricQueryRequest = {
  metric: string;
  dimension?: string;
  workspaceIds?: string[];
  boardIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, unknown>;
  customFieldKey?: string;
  aggregation?: 'count' | 'sum' | 'avg';
  includeComparison?: boolean;
  comparisonMode?: 'previous_period';
  segmentLabel?: string;
};

export type MetricQueryResponse = {
  metric: string;
  dimension: string;
  data: Record<string, unknown>;
  warnings: string[];
};

export type MetricFieldMappingRequest = {
  sourceType: 'core_field' | 'custom_field';
  sourceKey: string;
};

export async function getMetricCatalog(scope?: { workspaceIds?: string[]; boardIds?: string[] }): Promise<MetricCatalog> {
  const params = new URLSearchParams();
  scope?.workspaceIds?.forEach((id) => params.append('workspaceIds', id));
  scope?.boardIds?.forEach((id) => params.append('boardIds', id));
  const query = params.toString();
  const { data } = await apiClient.get<MetricCatalog>(`/api/metrics/catalog${query ? `?${query}` : ''}`);
  return data;
}

export async function queryMetric(payload: MetricQueryRequest): Promise<MetricQueryResponse> {
  const { data } = await apiClient.post<MetricQueryResponse>('/api/metrics/query', payload);
  return data;
}

export async function updateMetricFieldMapping(
  boardId: string,
  semanticKey: string,
  payload: MetricFieldMappingRequest
): Promise<MetricSemanticField> {
  const { data } = await apiClient.put<MetricSemanticField>(`/api/metrics/field-mappings/${boardId}/${semanticKey}`, payload);
  return data;
}

export async function deleteMetricFieldMapping(boardId: string, semanticKey: string): Promise<void> {
  await apiClient.delete(`/api/metrics/field-mappings/${boardId}/${semanticKey}`);
}

export async function getMetricDashboards(): Promise<MetricDashboardRecord[]> {
  const { data } = await apiClient.get<MetricDashboardRecord[]>('/api/metrics/dashboards');
  return data;
}

export async function getMetricPresetOverrides(): Promise<MetricPresetOverrideRecord[]> {
  const { data } = await apiClient.get<MetricPresetOverrideRecord[]>('/api/metrics/preset-overrides');
  return data;
}

export async function updateMetricPresetOverride(
  presetId: string,
  config: MetricDashboardConfig
): Promise<MetricPresetOverrideRecord> {
  const { data } = await apiClient.put<MetricPresetOverrideRecord>(`/api/metrics/preset-overrides/${presetId}`, { config });
  return data;
}

export async function deleteMetricPresetOverride(presetId: string): Promise<void> {
  await apiClient.delete(`/api/metrics/preset-overrides/${presetId}`);
}

export async function createMetricDashboard(
  payload: Partial<Omit<MetricDashboardRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<MetricDashboardRecord> {
  const { data } = await apiClient.post<MetricDashboardRecord>('/api/metrics/dashboards', payload);
  return data;
}

export async function updateMetricDashboard(
  dashboardId: string,
  payload: Partial<Omit<MetricDashboardRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<MetricDashboardRecord> {
  const { data } = await apiClient.patch<MetricDashboardRecord>(`/api/metrics/dashboards/${dashboardId}`, payload);
  return data;
}

export async function duplicateMetricDashboard(dashboardId: string): Promise<MetricDashboardRecord> {
  const { data } = await apiClient.post<MetricDashboardRecord>(`/api/metrics/dashboards/${dashboardId}/duplicate`);
  return data;
}

export async function deleteMetricDashboard(dashboardId: string): Promise<void> {
  await apiClient.delete(`/api/metrics/dashboards/${dashboardId}`);
}

export async function getMetrics(): Promise<Metric[]> {
  return Promise.resolve(MOCK_METRICS);
}
