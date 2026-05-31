import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { Box, Button, Checkbox, Chip, Divider, Paper, Popover, Typography } from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { alpha } from '@mui/material/styles';
import { useTaskBoard } from './useTaskBoard';
import type { FilterChoice, TaskFilterKey, TaskFilterState } from './taskFilters';
import {
  EMPTY_TASK_FILTERS,
  WORKFLOW_FILTER_CHOICES,
  getAssigneeFilterChoices,
  getFilterCount,
  getTagFilterChoices,
} from './taskFilters';

interface FilterButtonProps {
  label: string;
  choices: FilterChoice[];
  selected: string[];
  onToggle: (id: string) => void;
}

function FilterButton({ label, choices, selected, onToggle }: FilterButtonProps) {
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
              fontWeight: 800,
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
        slotProps={{ paper: { sx: { mt: 0.75, p: 1, width: 260, maxHeight: 320, borderRadius: 2 } } }}
      >
        <Typography sx={{ px: 1, py: 0.75, fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Divider sx={{ mb: 0.5 }} />

        {choices.length > 0 ? (
          <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
            {choices.map((choice, index) => {
              const checked = selected.includes(choice.id);
              const showGroup = choice.groupLabel && choice.groupLabel !== choices[index - 1]?.groupLabel;
              return (
                <Box key={choice.id}>
                  {showGroup && (
                    <Typography sx={{ px: 1, pt: index === 0 ? 0.75 : 1.25, pb: 0.25, fontSize: 10.5, color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase' }}>
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
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {choice.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography sx={{ px: 1, py: 1.5, fontSize: 12.5, color: 'text.secondary' }}>
            No filter values available.
          </Typography>
        )}
      </Popover>
    </>
  );
}

interface TaskFilterBarProps {
  filters: TaskFilterState;
  setFilters: Dispatch<SetStateAction<TaskFilterState>>;
  resultLabel: string;
  storageKey?: string;
}

export default function TaskFilterBar({ filters, setFilters, resultLabel, storageKey }: TaskFilterBarProps) {
  const { tasks, groups, users, boardConfig } = useTaskBoard();
  const taskList = useMemo(() => Object.values(tasks), [tasks]);
  const activeFilterCount = getFilterCount(filters);

  const groupChoices = useMemo<FilterChoice[]>(
    () => groups.map((group) => ({ id: group.id, label: group.name, color: group.color })),
    [groups]
  );
  const assigneeChoices = useMemo(() => getAssigneeFilterChoices(taskList, users), [taskList, users]);
  const priorityChoices = useMemo<FilterChoice[]>(
    () => boardConfig.priorityOptions.map((option) => ({ id: option.id, label: option.label, color: option.color })),
    [boardConfig.priorityOptions]
  );
  const tagChoices = useMemo(() => getTagFilterChoices(boardConfig), [boardConfig]);

  const toggleFilter = (key: TaskFilterKey, id: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => {
    if (storageKey) {
      window.sessionStorage.removeItem(storageKey);
    }
    setFilters(EMPTY_TASK_FILTERS);
  };

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
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <FilterButton label="Groups" choices={groupChoices} selected={filters.groupIds} onToggle={(id) => toggleFilter('groupIds', id)} />
        <FilterButton label="Assignees" choices={assigneeChoices} selected={filters.assigneeIds} onToggle={(id) => toggleFilter('assigneeIds', id)} />
        <FilterButton label="Priority" choices={priorityChoices} selected={filters.priorityIds} onToggle={(id) => toggleFilter('priorityIds', id)} />
        <FilterButton label="Workflow" choices={WORKFLOW_FILTER_CHOICES} selected={filters.workflowStates} onToggle={(id) => toggleFilter('workflowStates', id)} />
        <FilterButton label="Tags" choices={tagChoices} selected={filters.tagIds} onToggle={(id) => toggleFilter('tagIds', id)} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={resultLabel}
          sx={{ height: 26, fontSize: 11.5, fontWeight: 700, bgcolor: alpha('#5F0229', 0.08), color: 'primary.main' }}
        />
        {activeFilterCount > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={clearFilters}
            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700 }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  );
}
