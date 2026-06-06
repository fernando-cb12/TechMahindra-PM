import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricCatalog, MetricQueryResponse, MetricWidgetConfig } from '../../../services/metricsService';
import { dimensionLabel, formatMetricValue, getMetricHelp } from './metricHelp';

const LINE_COLORS = ['#5F0229', '#1976D2', '#2E7D32', '#F57C00', '#7B1FA2', '#00897B', '#C62828', '#6D4C41'];

type MetricVisualizationProps = {
  widgetConfig: MetricWidgetConfig;
  visualization: MetricWidgetConfig['visualization'];
  response: MetricQueryResponse | null;
  catalog?: MetricCatalog | null;
  onOpenSegment?: (segmentLabel: string) => void;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string | number;
    dataKey?: unknown;
    value?: unknown;
    payload?: Record<string, unknown>;
  }>;
};

function TooltipShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 2, p: 1, maxWidth: 260 }}>
      {children}
    </Box>
  );
}

function MetricVisualization({ widgetConfig, visualization, response, catalog, onOpenSegment }: MetricVisualizationProps) {
  const help = getMetricHelp(widgetConfig, catalog);
  if (!response) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{help.emptyStateHint}</Typography>;
  if (visualization === 'kpi') {
    const kpi = response.data.kpi as { value?: number } | undefined;
    const comparison = response.data.comparison as {
      absoluteDelta?: number;
      percentDelta?: number;
      isPositive?: boolean;
      hasPrevious?: boolean;
      periodLabel?: string;
    } | undefined;
    const hasComparison = Boolean(comparison);
    const comparisonColor = comparison?.isPositive ? 'success.main' : 'error.main';
    return (
      <Box sx={{ height: '100%', minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <Typography sx={{ fontSize: 34, fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
          {formatMetricValue(widgetConfig, kpi?.value ?? 0, catalog)}
        </Typography>
        {hasComparison && (
          <Typography sx={{ mt: 0.75, color: comparison?.hasPrevious ? comparisonColor : 'text.secondary', fontSize: 12, fontWeight: 800, lineHeight: 1.25 }}>
            {comparison?.hasPrevious
              ? `${(comparison.absoluteDelta ?? 0) > 0 ? '+' : ''}${formatMetricValue(widgetConfig, comparison.absoluteDelta ?? 0, catalog)} (${(comparison.percentDelta ?? 0) > 0 ? '+' : ''}${comparison.percentDelta ?? 0}%)`
              : 'No previous data'} {comparison?.periodLabel ?? ''}
          </Typography>
        )}
        <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 12, lineHeight: 1.2, textTransform: 'uppercase', fontWeight: 800 }}>
          {help.metricLabel}
        </Typography>
      </Box>
    );
  }
  if (visualization === 'line' || visualization === 'timeline') {
    const line = response.data.line as { points?: Array<Record<string, string | number>> } | undefined;
    const points = line?.points ?? [];
    if (points.length === 0) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{help.emptyStateHint}</Typography>;
    const isDualEventSeries = points.some((point) => 'created' in point || 'completed' in point);
    const dynamicSeries = isDualEventSeries
      ? []
      : Array.from(new Set(points.flatMap((point) => Object.keys(point).filter((key) => key !== 'x' && key !== 'value'))));
    if (visualization === 'timeline') {
      return (
        <Box sx={{ height: '100%', overflow: 'auto', pr: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, py: 0.5 }}>
            {points.map((point, index) => {
              const created = Number(point.created ?? 0);
              const completed = Number(point.completed ?? 0);
              const value = Number(point.value ?? 0);
              const hasCreated = created > 0;
              const hasCompleted = completed > 0;
              const hasValue = value > 0;
              return (
                <Box key={String(point.x ?? index)} sx={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: 1, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>{String(point.x ?? '')}</Typography>
                  <Box sx={{ position: 'relative', minHeight: 34, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -5,
                        top: 5,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: hasCompleted ? 'success.main' : hasCreated || hasValue ? 'primary.main' : 'divider',
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {isDualEventSeries ? (
                        <>
                          <Box sx={{ px: 0.75, py: 0.35, borderRadius: 1, bgcolor: 'action.hover' }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main' }}>
                              {formatMetricValue(widgetConfig, created, catalog)} created
                            </Typography>
                          </Box>
                          <Box sx={{ px: 0.75, py: 0.35, borderRadius: 1, bgcolor: 'action.hover' }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'success.main' }}>
                              {formatMetricValue(widgetConfig, completed, catalog)} completed
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ px: 0.75, py: 0.35, borderRadius: 1, bgcolor: 'action.hover' }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main' }}>
                            {formatMetricValue(widgetConfig, value, catalog)} {help.metricLabel.toLowerCase()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            content={({ active, label, payload }: ChartTooltipProps) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipShell>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>{String(label ?? '')}</Typography>
                  {payload.map((item) => (
                    <Typography key={String(item.dataKey ?? item.name)} sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {String(item.name ?? item.dataKey)}: {formatMetricValue(widgetConfig, item.value, catalog)}
                    </Typography>
                  ))}
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>{help.unit}</Typography>
                </TooltipShell>
              );
            }}
          />
          {isDualEventSeries ? (
            <>
              <Line type="monotone" dataKey="created" stroke="#A3334D" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="#4CAF50" strokeWidth={2} />
            </>
          ) : dynamicSeries.length > 0 ? (
            dynamicSeries.map((series, index) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                name={series}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            ))
          ) : (
            <Line type="monotone" dataKey="value" name={help.metricLabel} stroke="#A3334D" strokeWidth={2} />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (visualization === 'table') {
    const table = response.data.table as { rows?: Array<Record<string, unknown>> } | undefined;
    const rows = table?.rows ?? [];
    if (rows.length === 0) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{help.emptyStateHint}</Typography>;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, overflow: 'auto', maxHeight: '100%' }}>
        {rows.slice(0, 12).map((row, index) => (
          <Box
            key={index}
            onClick={() => {
              const label = String(row.label ?? row.day ?? '');
              if (row.label && onOpenSegment) onOpenSegment(label);
            }}
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, cursor: row.label ? 'pointer' : 'default' }}
          >
            <Typography sx={{ fontSize: 12 }}>{String(row.label ?? row.day ?? '-')}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{formatMetricValue(widgetConfig, row.value ?? row.created ?? 0, catalog)}</Typography>
          </Box>
        ))}
      </Box>
    );
  }
  const bar = response.data.bar as { labels?: string[]; values?: number[] } | undefined;
  const chartData = (bar?.labels ?? []).map((label, index) => ({ label, value: bar?.values?.[index] ?? 0 }));
  if (chartData.length === 0) return <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{help.emptyStateHint}</Typography>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          content={({ active, payload }: ChartTooltipProps) => {
            if (!active || !payload?.length) return null;
            const item = payload[0];
            const label = String(item.payload?.label ?? '');
            return (
              <TooltipShell>
                <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>{label}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {help.metricLabel}: {formatMetricValue(widgetConfig, item.value, catalog)}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>
                  Group by: {dimensionLabel(response.dimension)}
                </Typography>
              </TooltipShell>
            );
          }}
        />
        <Bar
          dataKey="value"
          fill="#5F0229"
          radius={[3, 3, 0, 0]}
          onClick={(data) => {
            const payload = data?.payload as { label?: unknown } | undefined;
            const label = typeof payload?.label === 'string' ? payload.label : '';
            if (label && onOpenSegment) onOpenSegment(label);
          }}
          cursor={onOpenSegment ? 'pointer' : 'default'}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default MetricVisualization;
