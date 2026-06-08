import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { getTaskBoard } from '../../../services/taskBoardService';
import { getWorkspaceBoards } from '../../../services/workspacesService';
import { showAppError } from '../../shared/appNotifications';

interface WorkspaceMetricsSectionProps {
  workspaceId: string;
}

type StatusMetricSegment = {
  id: string;
  name: string;
  value: number;
  color: string;
};

type WorkspaceTaskMetrics = {
  total: number;
  segments: StatusMetricSegment[];
};

const emptyMetrics = (): WorkspaceTaskMetrics => ({
  total: 0,
  segments: [],
});

function WorkspaceMetricsSection({ workspaceId }: WorkspaceMetricsSectionProps): React.ReactNode {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<WorkspaceTaskMetrics>(() => emptyMetrics());
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const boards = await getWorkspaceBoards(workspaceId);
      const boardPayloads = await Promise.all(
        boards.map((board) => getTaskBoard(workspaceId, board.id))
      );

      const statusMap = new Map<string, StatusMetricSegment>();
      let total = 0;

      for (const payload of boardPayloads) {
        for (const task of Object.values(payload.tasks)) {
          const statusOption = payload.boardConfig.statusOptions.find((option) => option.id === task.status);
          const rawStatus = statusOption?.id ?? task.status;
          const statusId = rawStatus || 'unclassified';
          const existing = statusMap.get(statusId);
          total += 1;

          if (existing) {
            existing.value += 1;
          } else {
            statusMap.set(statusId, {
              id: statusId,
              name: statusOption?.label || task.status || 'Unclassified',
              value: 1,
              color: statusOption?.color || theme.palette.text.secondary,
            });
          }
        }
      }

      setMetrics({
        total,
        segments: Array.from(statusMap.values()).sort((left, right) => left.name.localeCompare(right.name)),
      });
    } catch (error) {
      showAppError(error, 'Failed to load workspace metrics');
      setMetrics(emptyMetrics());
    } finally {
      setIsLoading(false);
    }
  }, [theme.palette.text.secondary, workspaceId]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    const refreshOnTaskChange = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
      if (!detail?.workspaceId || detail.workspaceId === workspaceId) {
        void loadMetrics();
      }
    };
    const refreshOnFocus = () => void loadMetrics();

    window.addEventListener('workspace:tasks-changed', refreshOnTaskChange);
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      window.removeEventListener('workspace:tasks-changed', refreshOnTaskChange);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [loadMetrics, workspaceId]);

  const metricData = useMemo(() => {
    return {
      label: 'Workspace Tasks',
      segments: metrics.segments.map((segment) => ({
        ...segment,
        percent: metrics.total > 0 ? Math.round((segment.value / metrics.total) * 100) : 0,
      })),
    };
  }, [metrics]);

  const size = 140;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  const segments = metricData.segments.map((segment, index, allSegments) => {
    const currentAngle = -90 + allSegments
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.percent / 100) * 360, 0);
    const offset = circumference * (segment.percent / 100);
    const dashArray = `${offset} ${circumference}`;
    const transform = `rotate(${currentAngle} ${size / 2} ${size / 2})`;

    return {
      ...segment,
      dashArray,
      transform,
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        p: 3,
        minHeight: 340,
        maxHeight: 460,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h2"
        data-page-title="true"
        sx={{
          mb: 2,
        }}
      >
        Metrics
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        {isLoading ? (
          <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: 'primary.main' }} />
          </Box>
        ) : (
          <svg width={size} height={size} style={{ maxWidth: '100%' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={alpha(theme.palette.text.secondary, 0.18)}
              strokeWidth="12"
            />
            {metrics.total > 0 && segments.map((segment) => (
              <circle
                key={segment.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={segment.dashArray}
                transform={segment.transform}
                style={{ opacity: 0.85 }}
              />
            ))}
          </svg>
        )}

        <Typography
          sx={{
            mt: 2,
            fontWeight: 700,
            fontSize: 14,
            color: 'text.primary',
            textAlign: 'center',
          }}
        >
          {metricData.label}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>
          {metrics.total} {metrics.total === 1 ? 'task' : 'tasks'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mt: 2,
          minHeight: 0,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            width: 8,
            backgroundColor: (theme) => alpha(theme.palette.text.secondary, 0.08),
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: '5px',
            backgroundColor: (theme) => alpha(theme.palette.text.secondary, 0.35),
          },
        }}
      >
        {metricData.segments.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>
            No tasks yet
          </Typography>
        ) : metricData.segments.map((segment) => (
          <Box key={segment.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: segment.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', flex: 1 }}>
              {segment.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: 'text.primary',
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {segment.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default WorkspaceMetricsSection;
