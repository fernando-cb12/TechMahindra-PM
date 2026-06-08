import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
type IssueStatus = 'overdue' | 'due-soon' | 'in-progress' | 'completed';

export interface RecentIssueData {
  taskId: string;
  key: string;
  summary: string;
  workspace: string;
  board: string;
  dueLabel: string;
  priority: IssuePriority;
  status: IssueStatus;
}

interface RecentIssuesSectionProps {
  issues: RecentIssueData[];
  onOpenAll: () => void;
  onOpenIssue?: (taskId: string) => void;
}

function IssuePill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        width: 'fit-content',
        maxWidth: '100%',
        height: 24,
        borderRadius: '5px',
        bgcolor: bg,
        color,
        '& .MuiChip-label': {
          px: 1,
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        },
      }}
    />
  );
}

function RecentIssuesSection({ issues, onOpenAll, onOpenIssue }: RecentIssuesSectionProps) {
  const theme = useTheme();
  const priorityConfig: Record<IssuePriority, { label: string; bg: string; color: string }> = {
    critical: { label: 'Critical', bg: alpha(theme.palette.error.main, 0.18), color: theme.palette.error.main },
    high: { label: 'High', bg: alpha(theme.palette.error.main, 0.12), color: theme.palette.error.main },
    medium: { label: 'Medium', bg: alpha(theme.palette.warning.main, 0.22), color: '#7A5800' },
    low: { label: 'Low', bg: alpha(theme.palette.success.main, 0.12), color: '#067647' },
  };

  const statusConfig: Record<IssueStatus, { label: string; bg: string; color: string }> = {
    overdue: { label: 'Overdue', bg: alpha(theme.palette.error.main, 0.14), color: theme.palette.error.main },
    'due-soon': { label: 'Due soon', bg: alpha(theme.palette.warning.main, 0.22), color: '#7A5800' },
    'in-progress': {
      label: 'In progress',
      bg: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.main,
    },
    completed: { label: 'Completed', bg: alpha(theme.palette.success.main, 0.12), color: '#067647' },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '5px',
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
        px: 2.25,
        py: 2.25,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={{ color: 'text.primary', fontSize: 20, fontWeight: 900 }}>
            Operational Focus
          </Typography>
          <Typography sx={{ mt: 0.6, color: 'text.secondary', fontSize: 13.5 }}>
            Tasks that deserve attention first based on due dates and delivery risk.
          </Typography>
        </Box>
        <Button
          onClick={onOpenAll}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '5px',
            color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
          }}
        >
          Open tasks
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {issues.length > 0 ? (
          issues.map((issue) => {
            const priority = priorityConfig[issue.priority];
            const status = statusConfig[issue.status];

            return (
              <Box
                key={issue.key}
                onClick={() => onOpenIssue?.(issue.taskId)}
                sx={{
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                  borderRadius: '5px',
                  px: 1.5,
                  py: 1.4,
                  cursor: onOpenIssue ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': onOpenIssue
                    ? {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
                      }
                    : undefined,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
                        letterSpacing: '0.04em',
                      }}
                    >
                      {issue.key}
                    </Typography>
                    <Typography sx={{ mt: 0.45, fontSize: 15, fontWeight: 800, color: 'text.primary', lineHeight: 1.3 }}>
                      {issue.summary}
                    </Typography>
                    <Typography sx={{ mt: 0.75, fontSize: 12.5, color: 'text.secondary' }}>
                      {issue.workspace} • {issue.board}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <IssuePill label={priority.label} bg={priority.bg} color={priority.color} />
                    <IssuePill label={status.label} bg={status.bg} color={status.color} />
                  </Box>
                </Box>

                <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'text.secondary' }}>
                    <EventOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                      {issue.dueLabel}
                    </Typography>
                  </Box>
                  {issue.status === 'overdue' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'error.main' }}>
                      <AssignmentLateOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                        Requires immediate follow-up
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            );
          })
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No active tasks need attention right now.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default RecentIssuesSection;
