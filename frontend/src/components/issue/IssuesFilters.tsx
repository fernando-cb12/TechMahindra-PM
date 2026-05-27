import { Box, FormControl, InputAdornment, MenuItem, Select, Stack, TextField, type SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import { alpha } from '@mui/material/styles';
import type { ChangeEvent } from 'react';

interface IssuesFiltersProps {
  searchQuery: string;
  projectFilter: string;
  assigneeFilter: string;
  projectOptions: string[];
  assigneeOptions: string[];
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProjectChange: (e: SelectChangeEvent) => void;
  onAssigneeChange: (e: SelectChangeEvent) => void;
}

const IssuesFilters = ({
  searchQuery,
  projectFilter,
  assigneeFilter,
  projectOptions,
  assigneeOptions,
  onSearchChange,
  onProjectChange,
  onAssigneeChange,
}: IssuesFiltersProps) => {
  const theme = useTheme();

  const selectSx = {
    height: 38,
    borderRadius: '5px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 700,
    fontSize: 14,
    color: 'text.secondary',
    backgroundColor: (t: any) => alpha(t.palette.grey[300], 0.28),
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'divider',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'text.secondary',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        p: 3,
        borderRadius: '5px',
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[300], 0.08) : alpha(theme.palette.grey[900], 0.05),
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search issues..."
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: { md: 420 },
          '& .MuiOutlinedInput-root': {
            bgcolor: theme.palette.background.default,
            borderRadius: '5px',
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'text.secondary',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
        <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
          <Select
            value={projectFilter}
            onChange={onProjectChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            sx={selectSx}
            inputProps={{ 'aria-label': 'Project filter' }}
          >
            {projectOptions.map((project) => (
              <MenuItem key={project} value={project}>
                {project === 'all' ? 'All Projects' : project}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
          <Select
            value={assigneeFilter}
            onChange={onAssigneeChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            sx={{
              ...selectSx,
              backgroundColor: (t) => alpha(t.palette.grey[300], 0.28),
            }}
            inputProps={{ 'aria-label': 'Assignee filter' }}
          >
            {assigneeOptions.map((assignee) => (
              <MenuItem key={assignee} value={assignee}>
                {assignee === 'all' ? 'All Assignees' : assignee}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default IssuesFilters;
