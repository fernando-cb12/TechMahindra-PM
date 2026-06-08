import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, Paper, Tooltip as MuiTooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { queryMetric, type MetricCatalog, type MetricQueryResponse, type MetricWidgetConfig } from '../../../services/metricsService';
import { showAppError } from '../../shared/appNotifications';
import { cleanFilters, type DrilldownTask, type GlobalFilters } from './types';
import MetricVisualization from './MetricVisualization';
import { dimensionLabel, getMetricHelp } from './metricHelp';

type MetricWidgetProps = {
  widgetConfig: MetricWidgetConfig;
  filters: GlobalFilters;
  catalog?: MetricCatalog | null;
  refreshKey?: number;
  isEditMode: boolean;
  onEdit: (widgetConfig: MetricWidgetConfig) => void;
  onRemove: (widgetConfig: MetricWidgetConfig) => void;
  onOpenDrilldown: (widgetConfig: MetricWidgetConfig, segmentLabel?: string) => void;
};

function MetricWidget({ widgetConfig, filters, catalog, refreshKey = 0, isEditMode, onEdit, onRemove, onOpenDrilldown }: MetricWidgetProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const requestKey = JSON.stringify({ widgetConfig, filters, refreshKey });
  const [responseState, setResponseState] = useState<{ key: string; response: MetricQueryResponse | null }>({ key: '', response: null });
  const response = responseState.key === requestKey ? responseState.response : null;
  const isLoading = responseState.key !== requestKey;
  const help = getMetricHelp(widgetConfig, catalog);
  const isKpi = widgetConfig.visualization === 'kpi';
  const drilldownRows = (response?.data?.drilldown as DrilldownTask[] | undefined) ?? [];

  useEffect(() => {
    let cancelled = false;
    queryMetric({
      metric: widgetConfig.metric,
      dimension: widgetConfig.dimension,
      workspaceIds: filters.workspaceIds,
      boardIds: filters.boardIds,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      filters: cleanFilters(filters),
      customFieldKey: widgetConfig.customFieldKey,
      aggregation: widgetConfig.aggregation,
      includeComparison: widgetConfig.includeComparison ?? widgetConfig.visualization === 'kpi',
      comparisonMode: 'previous_period',
    })
      .then((data) => {
        if (!cancelled) setResponseState({ key: requestKey, response: data });
      })
      .catch((e) => {
        if (!cancelled) showAppError(e, 'Failed to load metric');
      });
    return () => {
      cancelled = true;
    };
  }, [filters, requestKey, widgetConfig]);

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '5px',
        border: '1px solid',
        borderColor: isEditMode ? (isDark ? alpha('#FFFFFF', 0.6) : 'primary.main') : 'divider',
        bgcolor: isDark ? alpha('#FFFFFF', 0.05) : 'background.paper',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {widgetConfig.title}
          </Typography>
          <MuiTooltip
            placement="top"
            title={(
              <Box sx={{ maxWidth: 300 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{help.metricLabel}</Typography>
                <Typography sx={{ fontSize: 12, mt: 0.5 }}>{help.shortDescription}</Typography>
                <Typography sx={{ fontSize: 11, mt: 0.75, color: 'inherit', opacity: 0.9 }}>{help.calculation}</Typography>
                <Typography sx={{ fontSize: 11, mt: 0.75, color: 'inherit', opacity: 0.9 }}>
                  Unit: {help.unit} - Group by: {dimensionLabel(widgetConfig.dimension)}
                </Typography>
                {help.caveat && (
                  <Typography sx={{ fontSize: 11, mt: 0.75, color: 'inherit', opacity: 0.85 }}>{help.caveat}</Typography>
                )}
              </Box>
            )}
          >
            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
          </MuiTooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {isEditMode && (
            <>
              <MuiTooltip title="Edit widget">
                <IconButton size="small" onClick={() => onEdit(widgetConfig)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </MuiTooltip>
              <MuiTooltip title="Remove widget">
                <IconButton size="small" color="error" onClick={() => onRemove(widgetConfig)}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </MuiTooltip>
            </>
          )}
          <MuiTooltip title="Open drilldown">
            <IconButton size="small" onClick={() => onOpenDrilldown(widgetConfig)}>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isLoading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <MetricVisualization
            widgetConfig={widgetConfig}
            visualization={widgetConfig.visualization}
            response={response}
            catalog={catalog}
            onOpenSegment={(segmentLabel) => onOpenDrilldown(widgetConfig, segmentLabel)}
          />
        )}
      </Box>
      {!isLoading && response && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: isKpi ? 104 : 86, overflow: 'auto', flexShrink: 0 }}>
          {drilldownRows.slice(0, 3).map((task) => (
            <Box
              key={String(task.taskId)}
              onClick={() => navigate(`/workspaces/${task.workspaceId}/boards/${task.boardId}?task=${task.taskId}`)}
              sx={{
                px: 1,
                py: 0.6,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: isDark ? alpha('#FFFFFF', 0.08) : 'action.hover',
                '&:hover': { bgcolor: isDark ? alpha('#FFFFFF', 0.12) : 'action.selected' },
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {String(task.title ?? 'Task')}
              </Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {String(task.boardName ?? '')}
              </Typography>
            </Box>
          ))}
          {drilldownRows.length > 3 && (
            <Button size="small" onClick={() => onOpenDrilldown(widgetConfig)} sx={{ alignSelf: 'flex-start', minHeight: 24, px: 1, color: isDark ? '#FFFFFF' : 'primary.main' }}>
              View all
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default MetricWidget;
