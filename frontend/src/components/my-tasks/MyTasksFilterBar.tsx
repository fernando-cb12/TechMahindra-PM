import { useState } from 'react';
import { Box, Button, Checkbox, Chip, Paper, Popover, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { alpha } from '@mui/material/styles';
import type { DueDateFilterId, FilterChoice, MyTasksFilterMode, MyTasksFilters } from './types';
import { countFilters } from './myTasksUtils';

function FilterButton({
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedCount = selected.length;

  return (
    <>
      <Button
        size="small"
        variant={selectedCount > 0 ? 'contained' : 'outlined'}
        startIcon={<FilterAltOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ textTransform: 'none', borderRadius: 1.5, minHeight: 32 }}
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
        slotProps={{ paper: { sx: { mt: 0.75, p: 1, width: 260, maxHeight: 330, borderRadius: 2 } } }}
      >
        <Typography sx={{ px: 1, py: 0.75, fontSize: 12, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
          {choices.map((choice, index) => {
            const checked = selected.includes(choice.id);
            const showGroup = choice.groupLabel && choice.groupLabel !== choices[index - 1]?.groupLabel;
            return (
              <Box key={choice.id}>
                {showGroup && (
                  <Typography sx={{ px: 1, pt: index === 0 ? 0.5 : 1.25, pb: 0.25, fontSize: 10.5, color: 'text.disabled', fontWeight: 900, textTransform: 'uppercase' }}>
                    {choice.groupLabel}
                  </Typography>
                )}
                <Box
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
                  {choice.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: choice.color, flexShrink: 0 }} />}
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {choice.label}
                  </Typography>
                </Box>
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

export default function MyTasksFilterBar({
  filters,
  workspaceChoices,
  boardChoices,
  priorityChoices,
  statusChoices,
  dueDateChoices,
  filterMode,
  visibleCount,
  onToggleFilter,
  onFilterModeChange,
  onClear,
}: {
  filters: MyTasksFilters;
  workspaceChoices: FilterChoice[];
  boardChoices: FilterChoice[];
  priorityChoices: FilterChoice[];
  statusChoices: FilterChoice[];
  dueDateChoices: FilterChoice[];
  filterMode: MyTasksFilterMode;
  visibleCount: number;
  onToggleFilter: <K extends keyof MyTasksFilters>(key: K, value: MyTasksFilters[K][number]) => void;
  onFilterModeChange: (mode: MyTasksFilterMode) => void;
  onClear: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filterMode}
          onChange={(_, value: MyTasksFilterMode | null) => {
            if (value) onFilterModeChange(value);
          }}
          sx={{
            mr: 0.25,
            '& .MuiToggleButton-root': {
              height: 32,
              px: 1.35,
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 900,
            },
            '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
            '& .MuiToggleButtonGroup-grouped:not(:last-of-type)': { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
          }}
        >
          <ToggleButton value="kpis">KPIs</ToggleButton>
          <ToggleButton value="filters">Filters</ToggleButton>
        </ToggleButtonGroup>
        <FilterButton label="Workspace" choices={workspaceChoices} selected={filters.workspaceIds} onToggle={(id) => onToggleFilter('workspaceIds', id)} />
        <FilterButton label="Board" choices={boardChoices} selected={filters.boardIds} onToggle={(id) => onToggleFilter('boardIds', id)} />
        <FilterButton label="Priority" choices={priorityChoices} selected={filters.priorities} onToggle={(id) => onToggleFilter('priorities', id)} />
        {filterMode === 'filters' && (
          <>
            <FilterButton label="Status" choices={statusChoices} selected={filters.workflows} onToggle={(id) => onToggleFilter('workflows', id)} />
            <FilterButton label="Due date" choices={dueDateChoices} selected={filters.dueDates} onToggle={(id) => onToggleFilter('dueDates', id as DueDateFilterId)} />
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={`${visibleCount} visible`}
          sx={{ height: 26, fontSize: 11.5, fontWeight: 800, bgcolor: alpha('#5F0229', 0.08), color: 'primary.main' }}
        />
        {countFilters(filters) > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={onClear}
            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 800 }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  );
}
