import type { MetricCatalog, MetricCustomField, MetricWidgetConfig } from '../../../services/metricsService';

export type MetricHelp = {
  metricLabel: string;
  shortDescription: string;
  calculation: string;
  unit: string;
  caveat?: string;
  emptyStateHint: string;
};

const COUNT_UNIT = 'tasks';

const METRIC_HELP: Record<string, Omit<MetricHelp, 'metricLabel'>> = {
  task_count: {
    shortDescription: 'Total tasks in the current scope.',
    calculation: 'Counts all visible tasks after workspace, board, date, and global filters are applied.',
    unit: COUNT_UNIT,
    emptyStateHint: 'No tasks found in the current scope.',
  },
  open_tasks: {
    shortDescription: 'Tasks not mapped to Done.',
    calculation: 'Uses the status option workflow meaning, falling back to the legacy task status when needed.',
    unit: COUNT_UNIT,
    caveat: 'Boards without workflow meanings may produce incomplete open/done breakdowns.',
    emptyStateHint: 'No open tasks found in this scope.',
  },
  completed_tasks: {
    shortDescription: 'Tasks mapped to Done.',
    calculation: 'Counts tasks whose status option maps to the Done workflow meaning.',
    unit: COUNT_UNIT,
    caveat: 'Depends on workflow meanings configured on board status options.',
    emptyStateHint: 'No completed tasks found in this scope.',
  },
  completion_rate: {
    shortDescription: 'Completed tasks as a percentage of total scoped tasks.',
    calculation: 'Completed tasks divided by total tasks, multiplied by 100.',
    unit: '%',
    caveat: 'Depends on workflow meanings configured on board status options.',
    emptyStateHint: 'No tasks available to calculate completion rate.',
  },
  overdue_tasks: {
    shortDescription: 'Open tasks with due dates before today.',
    calculation: 'Counts tasks not mapped to Done where due date is earlier than the current date.',
    unit: COUNT_UNIT,
    caveat: 'Tasks without due dates are excluded.',
    emptyStateHint: 'No overdue tasks found in this scope.',
  },
  due_soon_tasks: {
    shortDescription: 'Open tasks due within the next 7 days.',
    calculation: 'Counts open tasks with due dates from today through the next 7 days.',
    unit: COUNT_UNIT,
    emptyStateHint: 'No due-soon tasks found in this scope.',
  },
  stale_tasks: {
    shortDescription: 'Open tasks that have not been updated in more than 7 days.',
    calculation: 'Counts open tasks where updated_at is older than 7 days.',
    unit: COUNT_UNIT,
    caveat: 'Uses task updated_at, not the volume of comments or activity text.',
    emptyStateHint: 'No stale tasks found in this scope.',
  },
  unassigned_tasks: {
    shortDescription: 'Open tasks without assignees.',
    calculation: 'Counts open tasks with no users in the multi-assignee relation.',
    unit: COUNT_UNIT,
    caveat: 'Uses task_assignees, not only the legacy assigned_to field.',
    emptyStateHint: 'No unassigned open tasks found in this scope.',
  },
  average_progress: {
    shortDescription: 'Average task progress percentage.',
    calculation: 'Averages the task progress value across scoped tasks.',
    unit: '%',
    emptyStateHint: 'No task progress values found in this scope.',
  },
  total_budget: {
    shortDescription: 'Total task budget.',
    calculation: 'Sums task budget values across the current scope.',
    unit: 'currency',
    caveat: 'Only tasks with budget values contribute to the total.',
    emptyStateHint: 'No budget values found in this scope.',
  },
  total_effort: {
    shortDescription: 'Total mapped task effort.',
    calculation: 'Sums the board column mapped as effort, such as story points, estimated hours, or complexity.',
    unit: 'points',
    emptyStateHint: 'No effort values found in this scope.',
  },
  average_effort: {
    shortDescription: 'Average mapped task effort.',
    calculation: 'Averages the board column mapped as effort across scoped tasks.',
    unit: 'points',
    emptyStateHint: 'No effort values found in this scope.',
  },
  average_lead_time: {
    shortDescription: 'Average time from task creation to completion.',
    calculation: 'Uses completed_at minus created_at for completed tasks.',
    unit: 'days',
    caveat: 'Only completed tasks are included.',
    emptyStateHint: 'No completed tasks with lead time data found in this scope.',
  },
  median_lead_time: {
    shortDescription: 'Median time from task creation to completion.',
    calculation: 'Uses the middle lead-time value among completed tasks.',
    unit: 'days',
    caveat: 'Only completed tasks are included.',
    emptyStateHint: 'No completed tasks with lead time data found in this scope.',
  },
  average_cycle_time: {
    shortDescription: 'Average time from first in-progress date to completion.',
    calculation: 'Uses completed_at minus first_started_at for completed tasks with both timestamps.',
    unit: 'days',
    caveat: 'Only tasks with both first_started_at and completed_at are included.',
    emptyStateHint: 'No completed tasks with cycle timestamps found in this scope.',
  },
  median_cycle_time: {
    shortDescription: 'Median time from first in-progress date to completion.',
    calculation: 'Uses the middle cycle-time value among completed tasks with both timestamps.',
    unit: 'days',
    caveat: 'Only tasks with both first_started_at and completed_at are included.',
    emptyStateHint: 'No completed tasks with cycle timestamps found in this scope.',
  },
  p90_cycle_time: {
    shortDescription: '90th percentile cycle time.',
    calculation: 'Shows the duration at or below which 90% of included completed tasks finished.',
    unit: 'days',
    caveat: 'Only tasks with both first_started_at and completed_at are included; small samples can be noisy.',
    emptyStateHint: 'No completed tasks with cycle timestamps found in this scope.',
  },
  created_vs_completed: {
    shortDescription: 'Task inflow compared with completions over time.',
    calculation: 'Plots task created_at dates against completed_at dates.',
    unit: 'tasks per date',
    caveat: 'Completion points require completed_at values.',
    emptyStateHint: 'No created or completed task events found in this date range.',
  },
};

const METRIC_LABELS: Record<string, string> = {
  task_count: 'Task count',
  open_tasks: 'Open tasks',
  completed_tasks: 'Completed tasks',
  completion_rate: 'Completion rate',
  overdue_tasks: 'Overdue tasks',
  due_soon_tasks: 'Due soon tasks',
  stale_tasks: 'Stale tasks',
  unassigned_tasks: 'Unassigned tasks',
  average_progress: 'Average progress',
  total_budget: 'Total budget',
  total_effort: 'Total effort',
  average_effort: 'Average effort',
  average_lead_time: 'Average lead time',
  median_lead_time: 'Median lead time',
  average_cycle_time: 'Average cycle time',
  median_cycle_time: 'Median cycle time',
  p90_cycle_time: 'P90 cycle time',
  created_vs_completed: 'Created vs completed',
  custom_field: 'Custom field',
};

export function findCustomField(config: MetricWidgetConfig, catalog?: MetricCatalog | null): MetricCustomField | undefined {
  if (!config.customFieldKey) return undefined;
  const direct = catalog?.customFields.find((field) => field.key === config.customFieldKey);
  if (direct || !config.customFieldKey.startsWith('group:')) return direct;
  const parts = config.customFieldKey.split(':');
  const encodedWorkspaceId = parts.length >= 4 ? parts[1] : undefined;
  const encodedType = parts.length >= 4 ? parts[2] : parts[1];
  const encodedLabel = parts.length >= 4 ? parts.slice(3).join(':') : parts.slice(2).join(':');
  if (!encodedType || !encodedLabel) return undefined;
  const workspaceId = encodedWorkspaceId ? decodeURIComponent(encodedWorkspaceId) : undefined;
  const type = decodeURIComponent(encodedType);
  const label = decodeURIComponent(encodedLabel);
  return catalog?.customFields.find((field) => (
    field.type === type
    && field.label.trim().toLowerCase() === label
    && (!workspaceId || field.workspaceId === workspaceId)
  ));
}

export function getMetricHelp(config: MetricWidgetConfig, catalog?: MetricCatalog | null): MetricHelp {
  const customField = findCustomField(config, catalog);
  if (config.metric === 'custom_field') {
    const aggregation = config.aggregation ?? 'count';
    const fieldLabel = customField?.label ?? config.customFieldKey ?? 'selected custom field';
    const unit = aggregation === 'count' ? COUNT_UNIT : customFieldUnit(customField);
    const action = aggregation === 'avg' ? 'Averages' : aggregation === 'sum' ? 'Sums' : 'Counts tasks with';
    return {
      metricLabel: `${aggregation.toUpperCase()} ${fieldLabel}`,
      shortDescription: `${action} values for "${fieldLabel}".`,
      calculation: customFieldCalculation(aggregation, fieldLabel),
      unit,
      caveat: customField ? `Field type: ${customField.type}. Values come from board custom fields.` : 'Choose a custom field to make this metric specific.',
      emptyStateHint: `No values found for "${fieldLabel}" in the current scope.`,
    };
  }

  const base = METRIC_HELP[config.metric] ?? {
    shortDescription: 'Metric calculated from the current task scope.',
    calculation: 'Uses the selected metric, group by, and global filters.',
    unit: 'value',
    emptyStateHint: 'No data found in this scope.',
  };
  return {
    metricLabel: METRIC_LABELS[config.metric] ?? humanize(config.metric),
    ...base,
  };
}

export function formatMetricValue(config: MetricWidgetConfig, value: unknown, catalog?: MetricCatalog | null): string {
  const number = Number(value ?? 0);
  const customField = findCustomField(config, catalog);
  const unit = config.metric === 'custom_field'
    ? config.aggregation === 'count' ? COUNT_UNIT : customFieldUnit(customField)
    : getMetricHelp(config, catalog).unit;

  if (unit === 'currency') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(number);
  }
  if (unit === '%' || unit === 'percentage') {
    return `${formatNumber(number)}%`;
  }
  if (unit === 'days') {
    return `${formatNumber(number)} ${number === 1 ? 'day' : 'days'}`;
  }
  if (unit === COUNT_UNIT || unit === 'tasks per date') {
    return `${formatNumber(number)} ${number === 1 ? 'task' : 'tasks'}`;
  }
  if (unit === 'points') {
    return `${formatNumber(number)} ${number === 1 ? 'point' : 'points'}`;
  }
  return formatNumber(number);
}

export function dimensionLabel(dimension: string): string {
  const labels: Record<string, string> = {
    none: 'None',
    workflow: 'Workflow',
    status: 'Status',
    priority: 'Priority',
    board: 'Board',
    workspace: 'Workspace',
    custom_field: 'Custom field',
  };
  return labels[dimension] ?? humanize(dimension);
}

function customFieldCalculation(aggregation: string, fieldLabel: string) {
  if (aggregation === 'avg') return `Average numeric value from "${fieldLabel}" across scoped tasks.`;
  if (aggregation === 'sum') return `Sum of numeric values from "${fieldLabel}" across scoped tasks.`;
  return `Count of scoped tasks with a value for "${fieldLabel}".`;
}

function customFieldUnit(customField?: MetricCustomField) {
  if (!customField) return 'value';
  if (customField.type === 'percentage' || customField.type === 'progress') return '%';
  if (customField.type === 'currency' || customField.type === 'budget') return 'currency';
  if (customField.type === 'checkbox') return 'true/false';
  if (customField.type === 'singleSelect' || customField.type === 'multiSelect') return 'options';
  return 'value';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function humanize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
