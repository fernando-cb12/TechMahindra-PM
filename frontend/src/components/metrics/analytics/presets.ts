import type { MetricWidgetConfig } from '../../../services/metricsService';

export const PRESETS = [
  { id: 'delivery', label: 'Delivery Health' },
  { id: 'risk', label: 'Risk & Aging' },
  { id: 'workload', label: 'Workload' },
  { id: 'flow', label: 'Board Flow' },
  { id: 'budget', label: 'Progress & Budget' },
  { id: 'cycle', label: 'Lead & Cycle Time' },
];

const NO_IMPLICIT_COMPARISON_METRICS = new Set([
  'average_lead_time',
  'median_lead_time',
  'average_cycle_time',
  'median_cycle_time',
  'p90_cycle_time',
]);

export const PRESET_WIDGETS: Record<string, MetricWidgetConfig[]> = {
  delivery: [
    widget('Completion Rate', 'completion_rate', 'none', 'kpi', 0, 0, 3, 3),
    widget('Open Tasks by Board', 'open_tasks', 'board', 'bar', 3, 0, 5, 3),
    widget('Created vs Completed', 'created_vs_completed', 'none', 'line', 8, 0, 4, 3),
    widget('Average Progress by Workspace', 'average_progress', 'workspace', 'bar', 0, 3, 6, 3),
  ],
  risk: [
    widget('Overdue Tasks', 'overdue_tasks', 'none', 'kpi', 0, 0, 3, 3),
    widget('Stale by Board', 'stale_tasks', 'board', 'bar', 3, 0, 5, 3),
    widget('Due Soon by Priority', 'due_soon_tasks', 'priority', 'bar', 8, 0, 4, 3),
    widget('Unassigned Tasks', 'unassigned_tasks', 'none', 'kpi', 0, 3, 3, 3),
  ],
  workload: [
    widget('Open by Priority', 'open_tasks', 'priority', 'bar', 0, 0, 5, 3),
    widget('Completed by Workspace', 'completed_tasks', 'workspace', 'bar', 5, 0, 5, 3),
    widget('Unassigned by Board', 'unassigned_tasks', 'board', 'bar', 0, 3, 6, 3),
  ],
  flow: [
    widget('Tasks by Workflow', 'task_count', 'workflow', 'bar', 0, 0, 5, 3),
    widget('Tasks by Status', 'task_count', 'status', 'bar', 5, 0, 5, 3),
    widget('Created vs Completed', 'created_vs_completed', 'none', 'line', 0, 3, 8, 3),
  ],
  budget: [
    widget('Total Budget', 'total_budget', 'none', 'kpi', 0, 0, 3, 3),
    widget('Budget by Workspace', 'total_budget', 'workspace', 'bar', 3, 0, 5, 3),
    widget('Average Progress by Board', 'average_progress', 'board', 'bar', 8, 0, 4, 3),
  ],
  cycle: [
    widget('Median Cycle Time', 'median_cycle_time', 'none', 'kpi', 0, 0, 3, 3),
    widget('P90 Cycle Time by Board', 'p90_cycle_time', 'board', 'bar', 3, 0, 5, 3),
    widget('Median Lead Time by Priority', 'median_lead_time', 'priority', 'bar', 8, 0, 4, 3),
  ],
};

export function widget(
  title: string,
  metric: string,
  dimension: string,
  visualization: MetricWidgetConfig['visualization'],
  x: number,
  y: number,
  w: number,
  h: number,
  customFieldKey?: string,
  aggregation?: 'count' | 'sum' | 'avg'
): MetricWidgetConfig {
  return {
    id: `${metric}-${dimension}-${x}-${y}`,
    title,
    metric,
    dimension,
    visualization,
    customFieldKey,
    aggregation,
    includeComparison: visualization === 'kpi' && !NO_IMPLICIT_COMPARISON_METRICS.has(metric),
    layout: { x, y, w, h },
  };
}
