import { Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

interface IssuesTabsProps {
  tab: 'all' | 'mine';
  onTabChange: (tab: 'all' | 'mine') => void;
}

const IssuesTabs = ({ tab, onTabChange }: IssuesTabsProps) => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
      <Button
        onClick={() => onTabChange('mine')}
        variant={tab === 'mine' ? 'contained' : 'outlined'}
        disableElevation
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '5px',
          boxShadow: 'none',
          px: 3,
          minHeight: 40,
          color:
            tab === 'mine'
              ? 'common.white'
              : theme.palette.mode === 'dark'
              ? 'common.white'
              : 'text.secondary',
          borderColor:
            tab === 'mine'
              ? 'primary.main'
              : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.32)'
              : 'divider',
          '&:hover': {
            bgcolor:
              tab === 'mine'
                ? 'primary.dark'
                : alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        My Issues
      </Button>
      <Button
        onClick={() => onTabChange('all')}
        variant={tab === 'all' ? 'contained' : 'outlined'}
        disableElevation
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '5px',
          boxShadow: 'none',
          px: 3,
          minHeight: 40,
          color:
            tab === 'all'
              ? 'common.white'
              : theme.palette.mode === 'dark'
              ? 'common.white'
              : 'text.secondary',
          borderColor:
            tab === 'all'
              ? 'primary.main'
              : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.32)'
              : 'divider',
          '&:hover': {
            bgcolor:
              tab === 'all'
                ? 'primary.dark'
                : alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        All Issues
      </Button>
    </Stack>
  );
};

export default IssuesTabs;
