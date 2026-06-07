import type { MouseEvent } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { alpha, useTheme } from '@mui/material/styles';
import type { MyTaskListItem } from '../../services/myTasksService';
import DueDatePill from './DueDatePill';
import TaskPill from './TaskPill';
import { clampProgress, getWorkflowLabel } from './myTasksUtils';

const TABLE_GRID = {
  xs: 'minmax(260px, 1.8fr) minmax(130px, .8fr) minmax(96px, .55fr) minmax(96px, .55fr) minmax(112px, .65fr) 44px',
  lg: 'minmax(300px, 1.8fr) minmax(145px, .75fr) minmax(135px, .7fr) minmax(96px, .5fr) minmax(96px, .5fr) minmax(112px, .58fr) minmax(160px, .78fr) 44px',
};

const TABLE_MIN_WIDTH = { xs: 738, lg: 1132 };
const HEADERS = ['Task', 'Workspace', 'Board', 'Status', 'Priority', 'Due date', 'Progress', ''];

export default function MyTasksTable({
  tasks,
  isLoading,
  onOpenTask,
  onOpenMenu,
  onOpenContextMenu,
}: {
  tasks: MyTaskListItem[];
  isLoading: boolean;
  onOpenTask: (taskId: string) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, taskId: string) => void;
  onOpenContextMenu: (event: MouseEvent<HTMLElement>, taskId: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? 'background.paper' : 'background.paper',
      }}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: TABLE_GRID,
            minWidth: TABLE_MIN_WIDTH,
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            bgcolor: isDark ? alpha('#FFFFFF', 0.06) : 'action.hover',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {HEADERS.map((label) => (
            <Typography
              key={label || 'actions'}
              sx={{
                display: { xs: label === 'Board' || label === 'Progress' ? 'none' : 'block', lg: 'block' },
                fontSize: 11,
                fontWeight: 900,
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        {isLoading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : tasks.length > 0 ? (
          tasks.map((task) => {
            const progress = clampProgress(task.progress);
            return (
              <Box
                key={task.id}
                onClick={() => onOpenTask(task.id)}
                onContextMenu={(event) => onOpenContextMenu(event, task.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: TABLE_GRID,
                  minWidth: TABLE_MIN_WIDTH,
                  alignItems: 'center',
                  gap: 1.25,
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: isDark ? alpha('#FFFFFF', 0.05) : 'action.hover' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.name}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 11.5, fontWeight: 700, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Workflow: {getWorkflowLabel(task.workflow)}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.workspaceName}
                </Typography>

                <Typography sx={{ display: { xs: 'none', lg: 'block' }, fontSize: 13, fontWeight: 700, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.boardName}
                </Typography>

                <Box>
                  <TaskPill label={task.statusLabel} color={task.statusColor} />
                </Box>

                <Box>
                  <TaskPill label={task.priorityLabel} color={task.priorityColor} />
                </Box>

                <Box>
                  <DueDatePill task={task} />
                </Box>

                <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      flex: 1,
                      height: 7,
                      borderRadius: 999,
                      bgcolor: isDark ? alpha('#FFFFFF', 0.12) : 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: task.workflow === 'done'
                          ? (isDark ? '#6CE9A6' : '#067647')
                          : (isDark ? '#F9FAFB' : '#5F0229'),
                        borderRadius: 999,
                      },
                    }}
                  />
                  <Typography sx={{ width: 38, textAlign: 'right', fontSize: 11.5, fontWeight: 900, color: 'text.secondary' }}>
                    {progress}%
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={(event) => onOpenMenu(event, task.id)}
                  aria-label="Task actions"
                  sx={{ justifySelf: 'end' }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })
        ) : (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', fontWeight: 700 }}>
              No tasks match this view.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
