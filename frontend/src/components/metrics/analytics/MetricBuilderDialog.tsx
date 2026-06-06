import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import {
  queryMetric,
  type MetricCatalog,
  type MetricQueryResponse,
  type MetricWidgetConfig,
} from '../../../services/metricsService';
import { showAppError } from '../../shared/appNotifications';
import { widget } from './presets';
import { cleanFilters, type GlobalFilters } from './types';
import MetricVisualization from './MetricVisualization';
import { getMetricHelp } from './metricHelp';
import { groupedCustomFieldKey, groupCustomFields } from './customFields';

type MetricBuilderDialogProps = {
  open: boolean;
  catalog: MetricCatalog | null;
  initialWidget?: MetricWidgetConfig | null;
  filters: GlobalFilters;
  onClose: () => void;
  onSave: (widgetConfig: MetricWidgetConfig) => void;
};

function MetricBuilderDialog({ open, catalog, initialWidget, filters, onClose, onSave }: MetricBuilderDialogProps) {
  const [metric, setMetric] = useState('task_count');
  const [dimension, setDimension] = useState('none');
  const [visualization, setVisualization] = useState<MetricWidgetConfig['visualization']>('bar');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [aggregation, setAggregation] = useState<'count' | 'sum' | 'avg'>('count');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState<MetricQueryResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMetric(initialWidget?.metric ?? 'task_count');
    setDimension(initialWidget?.dimension ?? 'none');
    setVisualization(initialWidget?.visualization ?? 'bar');
    setCustomFieldKey(initialWidget?.customFieldKey ?? '');
    setAggregation(initialWidget?.aggregation ?? 'count');
    setTitle(initialWidget?.title ?? '');
    setPreview(null);
  }, [initialWidget, open]);

  const selectedMetric = catalog?.metrics.find((item) => item.id === metric);
  const compatibleDimensions = catalog?.dimensions.filter((item) => selectedMetric?.compatibleDimensions.includes(item.id)) ?? [];
  const compatibleVisualizations = selectedMetric?.compatibleVisualizations ?? [];
  const customFields = useMemo(() => catalog?.customFields ?? [], [catalog?.customFields]);
  const customFieldGroups = useMemo(() => groupCustomFields(customFields), [customFields]);
  const selectedCustomFieldGroup = customFieldGroups.find((group) => group.key === customFieldKey);
  const selectedCustomField = selectedCustomFieldGroup?.fields[0] ?? customFields.find((field) => field.key === customFieldKey);
  const selectedCanMeasure = Boolean(selectedCustomFieldGroup?.canMeasure ?? selectedCustomField?.canMeasure);

  useEffect(() => {
    if (!open || metric !== 'custom_field' || !customFieldKey || customFieldKey.startsWith('group:')) return;
    const field = customFields.find((item) => item.key === customFieldKey);
    if (field) {
      setCustomFieldKey(groupedCustomFieldKey(field));
    }
  }, [customFieldKey, customFields, metric, open]);
  const locksDimension = visualization === 'timeline';
  const effectiveDimension = locksDimension ? 'none' : dimension;
  const customAggregationValid = metric !== 'custom_field'
    || aggregation === 'count'
    || selectedCanMeasure;
  const visualizationValid = compatibleVisualizations.includes(visualization);
  const dimensionValid = compatibleDimensions.some((item) => item.id === effectiveDimension);
  const customDimensionValid = effectiveDimension !== 'custom_field' || Boolean(customFieldKey);
  const canSave = visualizationValid
    && dimensionValid
    && customDimensionValid
    && (metric !== 'custom_field' || (Boolean(customFieldKey) && customAggregationValid));

  const resolvedTitle = title.trim() || (metric === 'custom_field'
    ? `${aggregation.toUpperCase()} ${selectedCustomField?.label ?? customFieldKey}`
    : selectedMetric?.label ?? metric);
  const draftWidget = {
    ...(initialWidget ?? widget(resolvedTitle, metric, effectiveDimension, visualization, 0, 0, 4, 3, customFieldKey || undefined, aggregation)),
    title: resolvedTitle,
    metric,
    dimension: effectiveDimension,
    visualization,
    customFieldKey: customFieldKey || undefined,
    aggregation,
  };
  const metricHelp = getMetricHelp(draftWidget, catalog);

  const handlePreview = async () => {
    if (!canSave) return;
    setIsPreviewLoading(true);
    try {
      const data = await queryMetric({
        metric,
        dimension: effectiveDimension,
        workspaceIds: filters.workspaceIds,
        boardIds: filters.boardIds,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        filters: cleanFilters(filters),
        customFieldKey: customFieldKey || undefined,
        aggregation,
        includeComparison: draftWidget.includeComparison ?? visualization === 'kpi',
        comparisonMode: 'previous_period',
      });
      setPreview(data);
    } catch (e) {
      showAppError(e, 'Failed to preview metric');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialWidget ? 'Edit Metric' : 'Add Metric'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          size="small"
          label="Widget title"
          value={title}
          placeholder={resolvedTitle}
          onChange={(event) => setTitle(event.target.value)}
          fullWidth
        />
        <FormControl fullWidth size="small">
          <InputLabel>Metric</InputLabel>
          <Select
            label="Metric"
            value={metric}
            onChange={(event) => {
              const nextMetric = event.target.value;
              const definition = catalog?.metrics.find((item) => item.id === nextMetric);
              setMetric(nextMetric);
              setDimension(definition?.compatibleDimensions[0] ?? 'none');
              setVisualization((definition?.compatibleVisualizations[0] as MetricWidgetConfig['visualization']) ?? 'bar');
              setPreview(null);
            }}
          >
            {catalog?.metrics.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
        {metric === 'custom_field' && (
          <>
            <FormControl fullWidth size="small">
              <InputLabel>Custom Field</InputLabel>
              <Select label="Custom Field" value={customFieldKey} onChange={(event) => { setCustomFieldKey(event.target.value); setPreview(null); }}>
                {customFieldGroups.map((group, index) => {
                  const previous = customFieldGroups[index - 1];
                  const showWorkspaceHeader = !previous || previous.workspaceId !== group.workspaceId;
                  return [
                    showWorkspaceHeader ? (
                      <MenuItem key={`workspace-${group.workspaceId}`} disabled sx={{ opacity: 1, py: 0.75 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
                          {group.workspaceName}
                        </Typography>
                      </MenuItem>
                    ) : null,
                    <MenuItem key={`${group.workspaceId}-${group.key}`} value={group.key}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{group.label}</Typography>
                          <Chip size="small" label={group.type} sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {group.fields.slice(0, 4).map((field) => (
                            <Chip
                              key={`${field.boardId}-${field.key}`}
                              size="small"
                              label={field.boardName ?? `Board ${field.boardId}`}
                              variant="outlined"
                              sx={{ height: 19, fontSize: 10 }}
                            />
                          ))}
                          {group.fields.length > 4 && (
                            <Chip size="small" label={`+${group.fields.length - 4}`} variant="outlined" sx={{ height: 19, fontSize: 10 }} />
                          )}
                        </Box>
                      </Box>
                    </MenuItem>,
                  ];
                })}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Aggregation</InputLabel>
              <Select label="Aggregation" value={aggregation} onChange={(event) => { setAggregation(event.target.value as 'count' | 'sum' | 'avg'); setPreview(null); }}>
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="sum" disabled={!selectedCanMeasure}>Sum</MenuItem>
                <MenuItem value="avg" disabled={!selectedCanMeasure}>Average</MenuItem>
              </Select>
            </FormControl>
            {!customAggregationValid && <Alert severity="warning">This custom field cannot be used as a numeric measure.</Alert>}
          </>
        )}
        <FormControl fullWidth size="small">
          <InputLabel>Group by</InputLabel>
          <Select
            label="Group by"
            value={locksDimension ? 'none' : dimension}
            disabled={locksDimension}
            onChange={(event) => { setDimension(event.target.value); setPreview(null); }}
          >
            {compatibleDimensions.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Visualization</InputLabel>
          <Select
            label="Visualization"
            value={visualization}
            onChange={(event) => {
              const nextVisualization = event.target.value as MetricWidgetConfig['visualization'];
              setVisualization(nextVisualization);
              if (nextVisualization === 'timeline') {
                setDimension('none');
              }
              setPreview(null);
            }}
          >
            {compatibleVisualizations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        {!dimensionValid && <Alert severity="warning">This group by option is not compatible with the selected metric.</Alert>}
        {!visualizationValid && <Alert severity="warning">This visualization is not compatible with the selected metric.</Alert>}
        {effectiveDimension === 'custom_field' && !customFieldKey && <Alert severity="warning">Choose a custom field before grouping by it.</Alert>}
        <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{metricHelp.metricLabel}</Typography>
          <Typography sx={{ fontSize: 12 }}>{metricHelp.shortDescription}</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5 }}>{metricHelp.calculation}</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5 }}>Unit: {metricHelp.unit}</Typography>
          {metricHelp.caveat && <Typography sx={{ fontSize: 11, mt: 0.5 }}>{metricHelp.caveat}</Typography>}
        </Alert>
        <Divider />
        <Box sx={{ minHeight: 92 }}>
          {isPreviewLoading ? (
            <>
              <Skeleton height={28} />
              <Skeleton height={28} />
              <Skeleton height={28} />
            </>
          ) : preview ? (
            <Box sx={{ height: 160 }}>
              <MetricVisualization widgetConfig={draftWidget} visualization={visualization} response={preview} catalog={catalog} />
            </Box>
          ) : (
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              Preview the metric to validate the current filters and builder options before saving.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={!canSave || isPreviewLoading} onClick={() => void handlePreview()}>Preview</Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => {
            onSave({
              ...draftWidget,
              title: resolvedTitle,
              metric,
              dimension: effectiveDimension,
              visualization,
              customFieldKey: customFieldKey || undefined,
              aggregation,
              includeComparison: draftWidget.includeComparison ?? visualization === 'kpi',
            });
            onClose();
          }}
        >
          {initialWidget ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MetricBuilderDialog;
