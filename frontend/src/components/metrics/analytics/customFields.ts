import type { MetricCustomField } from '../../../services/metricsService';

export type CustomFieldGroup = {
  key: string;
  label: string;
  type: string;
  workspaceId: string;
  workspaceName: string;
  fields: MetricCustomField[];
  canMeasure: boolean;
};

export function groupedCustomFieldKey(field: Pick<MetricCustomField, 'label' | 'type' | 'workspaceId'>) {
  return [
    'group',
    encodeURIComponent(field.workspaceId ?? 'unknown'),
    encodeURIComponent(field.type),
    encodeURIComponent(field.label.trim().toLowerCase()),
  ].join(':');
}

export function groupCustomFields(fields: MetricCustomField[]): CustomFieldGroup[] {
  const groups = new Map<string, CustomFieldGroup>();
  fields.forEach((field) => {
    const workspaceId = field.workspaceId ?? 'unknown';
    const workspaceName = field.workspaceName ?? 'Unknown workspace';
    const key = groupedCustomFieldKey(field);
    const existing = groups.get(key);
    if (existing) {
      existing.fields.push(field);
      existing.canMeasure = existing.canMeasure || field.canMeasure;
      return;
    }
    groups.set(key, {
      key,
      label: field.label,
      type: field.type,
      workspaceId,
      workspaceName,
      fields: [field],
      canMeasure: field.canMeasure,
    });
  });
  return Array.from(groups.values()).sort((left, right) => (
    left.workspaceName.localeCompare(right.workspaceName) || left.label.localeCompare(right.label)
  ));
}

