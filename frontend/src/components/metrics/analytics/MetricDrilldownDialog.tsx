import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { queryMetric } from '../../../services/metricsService';
import { showAppError } from '../../shared/appNotifications';
import { cleanFilters, csvEscape, formatDateTime, type DrilldownState, type DrilldownTask, type GlobalFilters } from './types';

type MetricDrilldownDialogProps = {
  open: boolean;
  state: DrilldownState | null;
  filters: GlobalFilters;
  onClose: () => void;
};

function MetricDrilldownDialog({ open, state, filters, onClose }: MetricDrilldownDialogProps) {
  const navigate = useNavigate();
  const requestKey = state
    ? JSON.stringify({
      id: state.widgetConfig.id,
      segmentLabel: state.segmentLabel ?? '',
      filters,
    })
    : '';
  const [rowsState, setRowsState] = useState<{ key: string; rows: DrilldownTask[] }>({ key: '', rows: [] });
  const rows = rowsState.key === requestKey ? rowsState.rows : [];
  const isLoading = open && Boolean(state) && rowsState.key !== requestKey;

  useEffect(() => {
    if (!open || !state) return;
    let cancelled = false;
    queryMetric({
      metric: state.widgetConfig.metric,
      dimension: state.widgetConfig.dimension,
      workspaceIds: filters.workspaceIds,
      boardIds: filters.boardIds,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      filters: cleanFilters(filters),
      customFieldKey: state.widgetConfig.customFieldKey,
      aggregation: state.widgetConfig.aggregation,
      segmentLabel: state.segmentLabel,
    })
      .then((data) => {
        if (!cancelled) {
          setRowsState({ key: requestKey, rows: ((data.data.drilldown as DrilldownTask[] | undefined) ?? []) });
        }
      })
      .catch((e) => {
        if (!cancelled) showAppError(e, 'Failed to load drilldown');
      });
    return () => {
      cancelled = true;
    };
  }, [filters, open, requestKey, state]);

  const exportCsv = () => {
    const headers = ['Task', 'Workspace', 'Board', 'Status', 'Workflow', 'Priority', 'Assignees', 'Due date', 'Updated', 'Progress', 'Budget', 'Custom value'];
    const body = rows.map((row) => [
      row.title,
      row.workspaceName,
      row.boardName,
      row.status,
      row.workflow,
      row.priority,
      row.assignees,
      row.dueDate,
      row.updatedAt,
      row.progress,
      row.budget,
      row.customValue,
    ]);
    const csv = [headers, ...body].map((line) => line.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrics-drilldown-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const title = state
    ? `${state.widgetConfig.title}${state.segmentLabel ? `: ${state.segmentLabel}` : ''}`
    : 'Metric drilldown';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            {rows.length} task{rows.length === 1 ? '' : 's'} in the current metric scope
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} disabled={!rows.length} onClick={exportCsv}>
            CSV
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography sx={{ fontWeight: 800 }}>No tasks found</Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: 13 }}>
              The current filters do not return task-level data for this widget.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Workspace</TableCell>
                  <TableCell>Board</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assignees</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Progress</TableCell>
                  <TableCell align="right">Budget</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    hover
                    key={String(row.taskId)}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/workspaces/${row.workspaceId}/boards/${row.boardId}?task=${row.taskId}`)}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>{row.title ?? 'Task'}</TableCell>
                    <TableCell>{row.workspaceName}</TableCell>
                    <TableCell>{row.boardName}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.workflow ?? 'unclassified'} />
                    </TableCell>
                    <TableCell>{row.priority}</TableCell>
                    <TableCell>{row.assignees}</TableCell>
                    <TableCell>{row.dueDate ?? ''}</TableCell>
                    <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                    <TableCell align="right">{row.progress ?? ''}</TableCell>
                    <TableCell align="right">{row.budget ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MetricDrilldownDialog;
