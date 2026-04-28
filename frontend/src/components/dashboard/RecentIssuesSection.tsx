import { Box, Chip, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type IssuePriority = 'high' | 'medium' | 'low';
type IssueStatus = 'in-progress' | 'to-do' | 'done';

export interface RecentIssueData {
  key: string;
  summary: string;
  assignee: string;
  priority: IssuePriority;
  status: IssueStatus;
}

interface RecentIssuesSectionProps {
  issues: RecentIssueData[];
}

function IssuePill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        width: 'fit-content',
        maxWidth: '100%',
        height: 14,
        borderRadius: '2px',
        bgcolor: bg,
        color,
        justifySelf: 'start',
        '& .MuiChip-label': {
          px: 0.75,
          fontSize: '7px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        },
      }}
    />
  );
}

function RecentIssuesSection({ issues }: RecentIssuesSectionProps) {
  const theme = useTheme();
  const priorityConfig: Record<IssuePriority, { label: string; bg: string; color: string }> = {
    high: { label: 'High', bg: theme.palette.error.main, color: theme.palette.common.white },
    medium: { label: 'Medium', bg: theme.palette.warning.main, color: theme.palette.grey[900] },
    low: { label: 'Low', bg: theme.palette.success.main, color: theme.palette.common.white },
  };

  const statusConfig: Record<IssueStatus, { label: string; bg: string; color: string }> = {
    'in-progress': {
      label: 'In Progress',
      bg: theme.palette.warning.main,
      color: theme.palette.grey[900],
    },
    'to-do': { label: 'To Do', bg: theme.palette.grey[500], color: theme.palette.common.white },
    done: { label: 'Done', bg: theme.palette.success.main, color: theme.palette.common.white },
  };

  return (
    <Box sx={{ mt: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '5px',
          bgcolor: 'background.paper',
          px: 1.75,
          py: 1.75,
        }}
      >
        <Typography
          sx={{
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.dark,
            fontSize: '15px',
            fontWeight: 700,
            mb: 1.5,
          }}
        >
          Recent Issues
        </Typography>

        <Box sx={{ bgcolor: (t) => alpha(t.palette.text.primary, 0.07), borderRadius: '2px', px: 1.25, py: 0.7 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 8fr 2.2fr 1.4fr 1.6fr',
              alignItems: 'center',
              columnGap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '8.5px',
                fontWeight: 700,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.primary.dark,
              }}
            >
              Key
            </Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'text.primary' }}>Summary</Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'text.primary' }}>Assignee</Typography>
            <Typography
              sx={{
                fontSize: '8.5px',
                fontWeight: 700,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.primary.dark,
              }}
            >
              Priority
            </Typography>
            <Typography
              sx={{
                fontSize: '8.5px',
                fontWeight: 700,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.primary.dark,
              }}
            >
              Status
            </Typography>
          </Box>
        </Box>

        {issues.map((issue) => {
          const priority = priorityConfig[issue.priority];
          const status = statusConfig[issue.status];

          return (
            <Box
              key={issue.key}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 8fr 2.2fr 1.4fr 1.6fr',
                alignItems: 'center',
                columnGap: 1,
                minHeight: 30,
                px: 1.25,
                borderBottom: (t) => `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  color: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.text.primary
                      : theme.palette.primary.dark,
                }}
              >
                {issue.key}
              </Typography>
              <Typography sx={{ fontSize: '8.5px', fontWeight: 500, color: 'text.primary' }}>
                {issue.summary}
              </Typography>
              <Typography sx={{ fontSize: '8.5px', fontWeight: 500, color: 'text.primary' }}>
                {issue.assignee}
              </Typography>
              <IssuePill label={priority.label} bg={priority.bg} color={priority.color} />
              <IssuePill label={status.label} bg={status.bg} color={status.color} />
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}

export default RecentIssuesSection;
