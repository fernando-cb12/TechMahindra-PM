import { Avatar, Box, Checkbox, Chip, Stack, Typography } from '@mui/material';
import type { IssueCardProps } from './types';
import { priorityColors, statusColors } from '../../styles/theme';

const priorityMap = {
  high: { label: 'High', color: priorityColors.High },
  medium: { label: 'Medium', color: priorityColors.Medium },
  low: { label: 'Low', color: priorityColors.Low },
} as const;

const statusMap = {
  'To Do': { color: statusColors.ToDo },
  'In Progress': { color: statusColors.InProgress },
  QA: { color: statusColors.QA },
  Done: { color: statusColors.Done },
} as const;

const IssueCard: React.FC<IssueCardProps> = ({
  issueKey,
  summary,
  project,
  assignee,
  assigneeAvatar,
  priority,
  status,
}) => {
  const priorityInfo = priorityMap[priority];
  const statusInfo = statusMap[status as keyof typeof statusMap] ?? {
    color: statusColors.ToDo,
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Checkbox size="small" />

      <Box sx={{ flex: 2, minWidth: 220 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.7,
            color: 'text.secondary',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          {issueKey}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary' }}>
          {summary}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>
          {project}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 180 }}>
        <Avatar
          src={assigneeAvatar}
          sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'primary.light' }}
        >
          {assignee
            .split(' ')
            .map((name) => name[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}>
            {assignee}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Assigned</Typography>
        </Box>
      </Stack>

      <Box sx={{ width: 100, display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={priorityInfo.label}
          sx={{
            minWidth: 90,
            px: 1.5,
            py: 0.5,
            bgcolor: priorityInfo.color,
            color: 'common.white',
            fontWeight: 700,
            fontSize: 12,
          }}
        />
      </Box>

      <Box sx={{ width: 110, display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={status}
          sx={{
            minWidth: 100,
            px: 1.5,
            py: 0.55,
            bgcolor: statusInfo.color,
            color: 'common.white',
            fontWeight: 700,
            fontSize: 12,
          }}
        />
      </Box>
    </Stack>
  );
};
export default IssueCard;