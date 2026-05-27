import { Box, Stack, Typography } from '@mui/material';

interface IssueStats {
  total: number;
  high: number;
  inProgress: number;
  done: number;
}

interface IssuesSummaryCardsProps {
  stats: IssueStats;
}

const IssuesSummaryCards = ({ stats }: IssuesSummaryCardsProps) => {
  const summaryCardSx = {
    backgroundColor: 'background.paper',
    borderRadius: '5px',
    px: 3,
    py: 2,
    border: '1px solid',
    borderColor: 'divider',
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
      <Box sx={{ ...summaryCardSx, flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>Total issues</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</Typography>
      </Box>
      <Box sx={{ ...summaryCardSx, flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>High priority</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700 }}>{stats.high}</Typography>
      </Box>
      <Box sx={{ ...summaryCardSx, flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>In progress</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700 }}>{stats.inProgress}</Typography>
      </Box>
      <Box sx={{ ...summaryCardSx, flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>Completed</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700 }}>{stats.done}</Typography>
      </Box>
    </Stack>
  );
};

export default IssuesSummaryCards;
