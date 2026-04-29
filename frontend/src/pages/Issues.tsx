import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { alpha, useTheme } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import NewIssue from '../components/issue/NewIssue';

type Priority = 'high' | 'medium' | 'low';

type IssueRow = {
  key: string;
  summary: string;
  assignee: string;
  priority: Priority;
  status: string;
};

const sampleIssues: IssueRow[] = [
  {
    key: 'APP-101',
    summary: 'Audit current UI components',
    assignee: 'Luis Mares',
    priority: 'high',
    status: 'To Do',
  },
  {
    key: 'APP-102',
    summary: 'Implement new design system',
    assignee: 'Marco Ibarra',
    priority: 'medium',
    status: 'To Do',
  },
  {
    key: 'APP-103',
    summary: 'Redesign login screen',
    assignee: 'Antonio Calderon',
    priority: 'high',
    status: 'To Do',
  },
  {
    key: 'APP-104',
    summary: 'Refactor navigation structure',
    assignee: 'Fernando Camou',
    priority: 'low',
    status: 'To Do',
  },
];

function assigneeInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Issues() {
  const theme = useTheme();
  const priorityColors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.success.main,
  } as const;

  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const handleProjectChange = (e: SelectChangeEvent) => {
    setProjectFilter(e.target.value);
  };

  const handleAssigneeChange = (e: SelectChangeEvent) => {
    setAssigneeFilter(e.target.value);
  };

  const toggleRow = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [openModal, setOpenModal] = useState(false);

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

      <TableContainer
        sx={{
          border: (t) => `1px solid ${t.palette.divider}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (t) => alpha(t.palette.grey[300], 0.18),
                '& th': {
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: (t) => alpha(t.palette.text.secondary, 0.58),
                  py: 1.75,
                },
              }}
            >
              <TableCell padding="checkbox" sx={{ width: 48 }} />
              <TableCell sx={{ width: '10%' }}>Key</TableCell>
              <TableCell sx={{ width: '32%' }}>Summary</TableCell>
              <TableCell sx={{ width: '22%' }}>Assignee</TableCell>
              <TableCell sx={{ width: '12%' }}>Priority</TableCell>
              <TableCell sx={{ width: '12%' }} align="right">
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleIssues.map((row) => (
              <TableRow
                key={row.key}
                sx={{
                  '& td': {
                    borderColor: 'grey.200',
                    fontFamily: 'Montserrat, sans-serif',
                    py: 1.5,
                  },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={!!selected[row.key]}
                    onChange={() => toggleRow(row.key)}
                    sx={{
                      p: 0.5,
                      color: 'common.black',
                      '&.Mui-checked': { color: 'primary.main' },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, fontSize: 12 }}>
                    {row.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 300, fontSize: 12 }}>
                    {row.summary}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 12,
                        fontWeight: 700,
                        bgcolor: 'secondary.main',
                      }}
                    >
                      {assigneeInitials(row.assignee)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 300, fontSize: 12 }}>
                      {row.assignee}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      minWidth: 47,
                      px: row.priority === 'medium' ? 1 : 0.75,
                      py: 0.25,
                      borderRadius: '5px',
                      bgcolor: priorityColors[row.priority],
                      color: 'common.white',
                      fontWeight: 700,
                      fontSize: 12,
                      textAlign: 'center',
                      textTransform: 'capitalize',
                    }}
                  >
                    {row.priority}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    disableElevation
                    sx={{
                      minWidth: 51,
                      height: 23,
                      px: 0.75,
                      borderRadius: '5px',
                      bgcolor: 'grey.500',
                      color: 'common.white',
                      fontFamily: 'Inter, Montserrat, sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'grey.600' },
                    }}
                  >
                    {row.status}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Issues;
