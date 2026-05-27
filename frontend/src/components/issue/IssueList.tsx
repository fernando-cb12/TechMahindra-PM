import { Box, Stack, Typography } from '@mui/material';
import IssueCard from './IssueCard';
import type { IssueCardProps } from './types';

type IssueListProps = {
  issues: IssueCardProps[];
};

const IssueList: React.FC<IssueListProps> = ({ issues }) => {
  return (
    <Box
      sx={{
        borderRadius: '5px',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 3,
          py: 2,
          backgroundColor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ width: 32 }} />
        <Typography sx={{ flex: 2, fontWeight: 700, fontSize: 12, color: 'text.secondary', letterSpacing: 0.8 }}>
          Issue
        </Typography>
        <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 12, color: 'text.secondary', letterSpacing: 0.8 }}>
          Assignee
        </Typography>
        <Typography sx={{ width: 100, textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'text.secondary', letterSpacing: 0.8 }}>
          Priority
        </Typography>
        <Typography sx={{ width: 110, textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'text.secondary', letterSpacing: 0.8 }}>
          Status
        </Typography>
      </Stack>

      {issues.length > 0 ? (
        issues.map((issue) => <IssueCard key={issue.issueKey} {...issue} />)
      ) : (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            No issues found. Adjust your filters to see results.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IssueList;