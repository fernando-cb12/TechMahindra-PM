import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Paper,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { alpha, useTheme } from '@mui/material/styles';
import type { WorkspaceProjectStatus } from './WorkspaceProjectCard';
import { WORKSPACE_STATUS_OPTIONS, getWorkspaceStatusLabel } from './workspaceStatus';

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
  memberOptions: string[];
};

type FilterChoice = {
  id: string;
  label: string;
};

const PROGRESS_CHOICES: FilterChoice[] = [
  { id: 'greater', label: 'Real > Estimated' },
  { id: 'less', label: 'Real < Estimated' },
  { id: 'equal', label: 'Real = Estimated' },
];

function countActiveFilters(filters: WorkspaceFilters) {
  return filters.status.length
    + filters.members.length
    + (filters.progressComparison !== 'all' ? 1 : 0)
    + (filters.dateFrom ? 1 : 0)
    + (filters.dateTo ? 1 : 0);
}

function MultiSelectFilterButton({
  label,
  choices,
  selected,
  onToggle,
}: {
  label: string;
  choices: FilterChoice[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedCount = selected.length;

  return (
    <>
      <Button
        size="small"
        variant={selectedCount > 0 ? 'contained' : 'outlined'}
        startIcon={<FilterAltOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          textTransform: 'none',
          borderRadius: 1.5,
          minHeight: 32,
          color: isDark ? (selectedCount > 0 ? '#FFFFFF' : '#F5F5F5') : 'primary.main',
          borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.28)) : undefined,
          bgcolor: selectedCount > 0 ? (isDark ? 'primary.main' : undefined) : 'transparent',
          '&:hover': {
            borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.45)) : undefined,
            bgcolor: isDark ? (selectedCount > 0 ? 'primary.dark' : alpha('#FFFFFF', 0.08)) : undefined,
          },
        }}
      >
        {label}
        {selectedCount > 0 && (
          <Chip
            size="small"
            label={selectedCount}
            sx={{
              ml: 0.75,
              height: 18,
              minWidth: 18,
              bgcolor: 'common.white',
              color: 'primary.main',
              fontSize: 10,
              fontWeight: 900,
              '& .MuiChip-label': { px: 0.6 },
            }}
          />
        )}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.75, p: 1, width: 260, maxHeight: 330, borderRadius: 2, bgcolor: isDark ? '#3B3B3B' : 'background.paper' } } }}
      >
        <Typography sx={{ px: 1, py: 0.75, fontSize: 12, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
          {choices.map((choice) => {
            const checked = selected.includes(choice.id);
            return (
              <Box
                key={choice.id}
                onClick={() => onToggle(choice.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 0.75,
                  py: 0.5,
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Checkbox checked={checked} size="small" sx={{ p: 0.25 }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {choice.label}
                </Typography>
              </Box>
            );
          })}
          {choices.length === 0 && (
            <Typography sx={{ px: 1, py: 1.5, fontSize: 12.5, color: 'text.secondary' }}>
              No filter values available.
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

function SingleSelectFilterButton({
  label,
  choices,
  selected,
  onToggle,
}: {
  label: string;
  choices: FilterChoice[];
  selected: string;
  onToggle: (id: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedCount = selected ? 1 : 0;

  return (
    <>
      <Button
        size="small"
        variant={selectedCount > 0 ? 'contained' : 'outlined'}
        startIcon={<FilterAltOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          textTransform: 'none',
          borderRadius: 1.5,
          minHeight: 32,
          color: isDark ? (selectedCount > 0 ? '#FFFFFF' : '#F5F5F5') : 'primary.main',
          borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.28)) : undefined,
          bgcolor: selectedCount > 0 ? (isDark ? 'primary.main' : undefined) : 'transparent',
          '&:hover': {
            borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.45)) : undefined,
            bgcolor: isDark ? (selectedCount > 0 ? 'primary.dark' : alpha('#FFFFFF', 0.08)) : undefined,
          },
        }}
      >
        {label}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.75, p: 1, width: 260, borderRadius: 2, bgcolor: isDark ? '#3B3B3B' : 'background.paper' } } }}
      >
        <Typography sx={{ px: 1, py: 0.75, fontSize: 12, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Box>
          {choices.map((choice) => {
            const checked = selected === choice.id;
            return (
              <Box
                key={choice.id}
                onClick={() => onToggle(choice.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 0.75,
                  py: 0.5,
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Checkbox checked={checked} size="small" sx={{ p: 0.25 }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                  {choice.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}

function DateFilterButton({ filters, onChange }: { filters: WorkspaceFilters; onChange: (filters: WorkspaceFilters) => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedCount = (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  return (
    <>
      <Button
        size="small"
        variant={selectedCount > 0 ? 'contained' : 'outlined'}
        startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          textTransform: 'none',
          borderRadius: 1.5,
          minHeight: 32,
          color: isDark ? (selectedCount > 0 ? '#FFFFFF' : '#F5F5F5') : 'primary.main',
          borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.28)) : undefined,
          bgcolor: selectedCount > 0 ? (isDark ? 'primary.main' : undefined) : 'transparent',
          '&:hover': {
            borderColor: isDark ? (selectedCount > 0 ? 'primary.main' : alpha('#FFFFFF', 0.45)) : undefined,
            bgcolor: isDark ? (selectedCount > 0 ? 'primary.dark' : alpha('#FFFFFF', 0.08)) : undefined,
          },
        }}
      >
        Period
        {selectedCount > 0 && (
          <Chip
            size="small"
            label={selectedCount}
            sx={{
              ml: 0.75,
              height: 18,
              minWidth: 18,
              bgcolor: 'common.white',
              color: 'primary.main',
              fontSize: 10,
              fontWeight: 900,
              '& .MuiChip-label': { px: 0.6 },
            }}
          />
        )}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.75, p: 1.5, width: 280, borderRadius: 2, bgcolor: isDark ? '#3B3B3B' : 'background.paper' } } }}
      >
        <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
          Period
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <TextField
            size="small"
            label="From"
            type="text"
            placeholder="MM/DD/YYYY"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '\\d{2}/\\d{2}/\\d{4}',
            }}
          />
          <TextField
            size="small"
            label="To"
            type="text"
            placeholder="MM/DD/YYYY"
            value={filters.dateTo}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              inputMode: 'numeric',
              pattern: '\\d{2}/\\d{2}/\\d{4}',
            }}
          />
        </Box>
      </Popover>
    </>
  );
}

function WorkspaceFilterBar({ filters, onFiltersChange, memberOptions }: WorkspaceFilterBarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const activeCount = countActiveFilters(filters);
  const statusChoices = WORKSPACE_STATUS_OPTIONS.map((option) => ({
    id: option.value,
    label: getWorkspaceStatusLabel(option.value),
  }));
  const memberChoices = memberOptions.map((member) => ({ id: member, label: member }));

  const toggleMultiFilter = <K extends 'status' | 'members'>(key: K, value: WorkspaceFilters[K][number]) => {
    const current = filters[key] as string[];
    const next = current.includes(String(value))
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFiltersChange({
      ...filters,
      [key]: next,
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
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
        bgcolor: isDark ? 'background.paper' : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <MultiSelectFilterButton
          label="Status"
          choices={statusChoices}
          selected={filters.status}
          onToggle={(id) => toggleMultiFilter('status', id as WorkspaceProjectStatus)}
        />
        <MultiSelectFilterButton
          label="Members"
          choices={memberChoices}
          selected={filters.members}
          onToggle={(id) => toggleMultiFilter('members', id)}
        />
        <SingleSelectFilterButton
          label="Progress"
          choices={PROGRESS_CHOICES}
          selected={filters.progressComparison === 'all' ? '' : filters.progressComparison}
          onToggle={(id) => onFiltersChange({
            ...filters,
            progressComparison: filters.progressComparison === id ? 'all' : id as WorkspaceFilters['progressComparison'],
          })}
        />
        <DateFilterButton filters={filters} onChange={onFiltersChange} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={activeCount > 0 ? `${activeCount} active` : 'All workspaces'}
          sx={{
            height: 26,
            fontSize: 11.5,
            fontWeight: 800,
            bgcolor: isDark ? alpha('#FFFFFF', 0.14) : alpha('#5F0229', 0.08),
            color: isDark ? '#FFFFFF' : 'primary.main',
          }}
        />
        {activeCount > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={handleClearFilters}
            sx={{
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 800,
              color: isDark ? '#FFFFFF' : 'primary.main',
              '&:hover': {
                bgcolor: isDark ? alpha('#FFFFFF', 0.06) : undefined,
              },
            }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export { WorkspaceFilterBar };
export type { WorkspaceFilters };
