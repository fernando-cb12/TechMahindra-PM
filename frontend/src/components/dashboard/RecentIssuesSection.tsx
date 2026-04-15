import { Box, Chip, Paper, Typography } from '@mui/material';

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

const priorityConfig: Record<IssuePriority, { label: string; bg: string; color: string }> = {
  high: { label: 'High', bg: '#FB485B', color: '#FFFFFF' },
  medium: { label: 'Medium', bg: '#EAC24F', color: '#5A1800' },
  low: { label: 'Low', bg: '#3CC85F', color: '#FFFFFF' },
};

const statusConfig: Record<IssueStatus, { label: string; bg: string; color: string }> = {
  'in-progress': { label: 'In Progress', bg: '#EAC24F', color: '#5A1800' },
  'to-do': { label: 'To Do', bg: '#A4A4A4', color: '#FFFFFF' },
  done: { label: 'Done', bg: '#45C84D', color: '#FFFFFF' },
};

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
  return (
    <Box sx={{ mt: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '5px',
          bgcolor: '#FFFFFF',
          px: 1.75,
          py: 1.75,
        }}
      >
        <Typography sx={{ color: 'primary.dark', fontSize: '15px', fontWeight: 700, mb: 1.5 }}>
          Recent Issues
        </Typography>

        <Box sx={{ bgcolor: '#F5F5F5', borderRadius: '2px', px: 1.25, py: 0.7 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 8fr 2.2fr 1.4fr 1.6fr',
              alignItems: 'center',
              columnGap: 1,
            }}
          >
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'primary.dark' }}>Key</Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: '#29251C' }}>Summary</Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: '#29251C' }}>Assignee</Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'primary.dark' }}>Priority</Typography>
            <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'primary.dark' }}>Status</Typography>
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
                borderBottom: '1px solid #D6A6BC',
              }}
            >
              <Typography sx={{ fontSize: '8.5px', fontWeight: 700, color: 'primary.dark' }}>
                {issue.key}
              </Typography>
              <Typography sx={{ fontSize: '8.5px', fontWeight: 500, color: '#2C2C2C' }}>
                {issue.summary}
              </Typography>
              <Typography sx={{ fontSize: '8.5px', fontWeight: 500, color: '#2C2C2C' }}>
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
