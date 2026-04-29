import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha, useTheme } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import NewIssue from '../components/issue/NewIssue';
import IssueList from '../components/issue/IssueList';

type Priority = 'high' | 'medium' | 'low';

type IssueRow = {
  issueKey: string;
  summary: string;
  assignee: string;
  priority: Priority;
  status: string;
};

const sampleIssues: IssueRow[] = [
  {
    issueKey: 'APP-101',
    summary: 'Audit current UI components',
    assignee: 'Luis Mares',
    priority: 'high',
    status: 'To Do',
  },
  {
    issueKey: 'APP-102',
    summary: 'Implement new design system',
    assignee: 'Marco Ibarra',
    priority: 'medium',
    status: 'To Do',
  },
  {
    issueKey: 'APP-103',
    summary: 'Redesign login screen',
    assignee: 'Antonio Calderon',
    priority: 'high',
    status: 'To Do',
  },
  {
    issueKey: 'APP-104',
    summary: 'Refactor navigation structure',
    assignee: 'Fernando Camou',
    priority: 'low',
    status: 'To Do',
  },
];

function Issues() {
  const theme = useTheme();

  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);

  const handleProjectChange = (e: SelectChangeEvent) => {
    setProjectFilter(e.target.value);
  };

  const handleAssigneeChange = (e: SelectChangeEvent) => {
    setAssigneeFilter(e.target.value);
  };

  const visibleIssues =
    tab === 'mine'
      ? sampleIssues.filter((r) => r.assignee === 'Antonio Calderon')
      : sampleIssues;

  const selectSx = {
    height: 35,
    borderRadius: '10px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: 'text.secondary',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'common.black',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'common.black',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'common.black',
    },
  };

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'background.paper',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 21.5,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
          }}
        >
          Issues
        </Typography>
        <Button
          onClick={() => setOpenModal(true)}
          variant="contained"
          disableElevation
          sx={{
            bgcolor: 'primary.main',
            borderRadius: '5px',
            minHeight: 32,
            px: 2,
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'none',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          + Create Issue
        </Button>
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Create Issue</DialogTitle>
          <DialogContent>
            <NewIssue />
          </DialogContent>
        </Dialog>
      </Stack>

      {/* Tabs + Filters */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            onClick={() => setTab('all')}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: tab === 'all' ? 'primary.main' : 'transparent',
              color: tab === 'all' ? 'common.white' : 'text.secondary',
              borderRadius: '5px',
              minHeight: 32,
              px: 2,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor:
                  tab === 'all'
                    ? 'primary.dark'
                    : (t) => alpha(t.palette.primary.main, 0.06),
                boxShadow: 'none',
              },
            }}
          >
            All Issues
          </Button>
          <Button
            onClick={() => setTab('mine')}
            variant="text"
            sx={{
              color: (theme) =>
                tab === 'mine'
                  ? theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : theme.palette.primary.main
                  : theme.palette.text.secondary,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              minWidth: 'auto',
              p: 0.5,
              ...(tab === 'mine' && {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }),
            }}
          >
            My Issues
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 153 }}>
            <Select
              value={projectFilter}
              onChange={handleProjectChange}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={selectSx}
              inputProps={{ 'aria-label': 'Project filter' }}
            >
              <MenuItem value="all">All Projects</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={assigneeFilter}
              onChange={handleAssigneeChange}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                ...selectSx,
                backgroundColor: (t) => alpha(t.palette.grey[300], 0.35),
              }}
              inputProps={{ 'aria-label': 'Assignee filter' }}
            >
              <MenuItem value="all">All Assignees</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Issue List */}
      <IssueList issues={visibleIssues} />
    </Box>
  );
}

export default Issues;
