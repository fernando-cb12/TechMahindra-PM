import StatusButton from './StatusButton';
import PriorityButton from './PriorityButton';
import type { IssueCardProps } from './types';
import { Avatar, Box, Checkbox, Stack, Typography } from '@mui/material';

const IssueCard: React.FC<IssueCardProps> = ({
  issueKey,
  summary,
  assignee,
  assigneeAvatar,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e8e8e8' }}
    >
      <Checkbox size="small" />

      <Typography sx={{ fontWeight: 700, fontSize: 12, width: '10%' }}>
        {issueKey}
      </Typography>

      <Typography sx={{ fontWeight: 300, fontSize: 12, width: '32%' }}>
        {summary}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ width: '22%' }}
      >
        <Avatar src={assigneeAvatar} sx={{ width: 32, height: 32 }}>
          {assignee
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Avatar>
        <Typography sx={{ fontSize: 12 }}>{assignee}</Typography>
      </Stack>

      {/* Use your existing components */}
      <Box sx={{ width: '12%' }}>
        <PriorityButton />
      </Box>

      <Box sx={{ width: '12%', display: 'flex', justifyContent: 'flex-end' }}>
        <StatusButton />
      </Box>
    </Stack>
  );
};
export default IssueCard;