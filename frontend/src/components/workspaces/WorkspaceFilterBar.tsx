import { Box, Button, Stack, TextField, Select, MenuItem, OutlinedInput, useTheme } from '@mui/material';
import type { WorkspaceProjectStatus } from './WorkspaceProjectCard';

type WorkspaceFilters = {
  status: WorkspaceProjectStatus[];
  members: string[];
  dateFrom: string;
  dateTo: string;
  progressComparison: 'all' | 'greater' | 'less' | 'equal';
};

type WorkspaceFilterBarProps = {
  filters: WorkspaceFilters;
  onFiltersChange: (filters: WorkspaceFilters) => void;
  /** Member names derived from loaded projects (and assignable roster when applicable). */
  memberOptions: string[];
};

function WorkspaceFilterBar({ filters, onFiltersChange, memberOptions }: WorkspaceFilterBarProps) {
  const theme = useTheme();

  const handleStatusChange = (value: string[]) => {
    onFiltersChange({
      ...filters,
      status: value as WorkspaceProjectStatus[],
    });
  };

  const handleMembersChange = (value: string[]) => {
    onFiltersChange({
      ...filters,
      members: value,
    });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateFrom: value,
    });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateTo: value,
    });
  };

  const handleProgressChange = (value: string) => {
    onFiltersChange({
      ...filters,
      progressComparison: value as WorkspaceFilters['progressComparison'],
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: [],
      members: [],
      dateFrom: '',
      dateTo: '',
      progressComparison: 'all',
    });
  };

  return (
    <Box
      sx={{
        mt: 3,
        p: 2,
        borderRadius: '5px',
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Status Filter */}
          <Box sx={{ flex: 1 }}>
            <Select
              multiple
              displayEmpty
              fullWidth
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value as string[])}
              input={<OutlinedInput />}
              renderValue={(selected) =>
                selected.length === 0 ? 'All status' : `Status (${selected.length})`
              }
              sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </Box>

          {/* Members Filter */}
          <Box sx={{ flex: 1 }}>
            <Select
              multiple
              displayEmpty
              fullWidth
              value={filters.members}
              onChange={(e) => handleMembersChange(e.target.value as string[])}
              input={<OutlinedInput />}
              renderValue={(selected) =>
                selected.length === 0 ? 'All Members' : `Members (${selected.length})`
              }
              sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}
            >
              {memberOptions.map((member) => (
                <MenuItem key={member} value={member}>
                  {member}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Progress Comparison */}
          <Box sx={{ flex: 1 }}>
            <Select
              fullWidth
              value={filters.progressComparison}
              onChange={(e) => handleProgressChange(e.target.value)}
              sx={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}
            >
              <MenuItem value="all">All progress</MenuItem>
              <MenuItem value="greater">Real &gt; Estimated</MenuItem>
              <MenuItem value="less">Real &lt; Estimated</MenuItem>
              <MenuItem value="equal">Real = Estimated</MenuItem>
            </Select>
          </Box>
        </Stack>

        {/* Date Range */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
          <TextField
            label="From"
            type="text"
            placeholder="MM/DD/YYYY"
            value={filters.dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '\\d{2}/\\d{2}/\\d{4}',
              sx: { fontFamily: 'Montserrat, sans-serif' },
              placeholder: 'MM/DD/YYYY',
            }}
          />
          <TextField
            label="To"
            type="text"
            placeholder="MM/DD/YYYY"
            value={filters.dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '\\d{2}/\\d{2}/\\d{4}',
              sx: { fontFamily: 'Montserrat, sans-serif' },
              placeholder: 'MM/DD/YYYY',
            }}
          />
          <Button
            onClick={handleClearFilters}
            sx={{
              textTransform: 'none',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              color: theme.palette.mode === 'light' ? 'primary.main' : 'common.white',
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'light'
                    ? 'rgba(95, 2, 41, 0.08)'
                    : 'rgba(255, 255, 255, 0.12)',
              },
            }}
          >
            Clear Filters
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export { WorkspaceFilterBar };
export type { WorkspaceFilters };
