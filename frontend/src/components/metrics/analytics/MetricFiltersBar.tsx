import { useState } from 'react';
import { Box, Button, Checkbox, Chip, Paper, Popover, TextField, Typography } from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { alpha } from '@mui/material/styles';
import type { MetricCatalog } from '../../../services/metricsService';
import type { WorkspaceBoard } from '../../../services/workspacesService';
import { DEFAULT_FILTERS, type GlobalFilters } from './types';

type FilterChoice = {
  id: string;
  label: string;
  groupLabel?: string;
};

type MetricFiltersBarProps = {
  filters: GlobalFilters;
  workspaces: Array<{ id: string; title: string }>;
  boards: Array<WorkspaceBoard & { workspaceId: string }>;
  assignees: MetricCatalog['assignees'];
  onChange: (filters: GlobalFilters) => void;
};

const WORKFLOW_CHOICES: FilterChoice[] = [
  { id: 'new', label: 'New' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'unclassified', label: 'Unclassified' },
];

const PRIORITY_CHOICES: FilterChoice[] = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const DUE_DATE_CHOICES: FilterChoice[] = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'due_soon', label: 'Due soon' },
  { id: 'no_date', label: 'No date' },
];

function countActiveFilters(filters: GlobalFilters) {
  return filters.workspaceIds.length
    + filters.boardIds.length
    + (filters.workflow ? 1 : 0)
    + (filters.priority ? 1 : 0)
    + (filters.assigneeId ? 1 : 0)
    + (filters.dueDateState ? 1 : 0)
    + (filters.dateFrom ? 1 : 0)
    + (filters.dateTo ? 1 : 0);
}

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
        slotProps={{ paper: { sx: { mt: 0.75, p: 1, width: 280, maxHeight: 330, borderRadius: 2 } } }}
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

function DateFilterButton({ filters, onChange }: { filters: GlobalFilters; onChange: (filters: GlobalFilters) => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedCount = (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  return (
    <>
      <Button
        size="small"
        variant={selectedCount > 0 ? 'contained' : 'outlined'}
        startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ textTransform: 'none', borderRadius: 1.5, minHeight: 32 }}
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
        slotProps={{ paper: { sx: { mt: 0.75, p: 1.5, width: 280, borderRadius: 2 } } }}
      >
        <Typography sx={{ mb: 1, fontSize: 12, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
          Period
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <TextField
            size="small"
            label="From"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filters.dateTo}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Popover>
    </>
  );
}

function toggleSingle(current: string, next: string) {
  return current === next ? '' : next;
}

function MetricFiltersBar({ filters, workspaces, boards, assignees, onChange }: MetricFiltersBarProps) {
  const visibleBoards = filters.workspaceIds.length
    ? boards.filter((board) => filters.workspaceIds.includes(board.workspaceId))
    : boards;
  const workspaceChoices = workspaces.map((workspace) => ({ id: workspace.id, label: workspace.title }));
  const boardChoices = visibleBoards.map((board) => ({
    id: board.id,
    label: board.name,
    groupLabel: workspaces.find((workspace) => workspace.id === board.workspaceId)?.title,
  }));
  const assigneeChoices = assignees.map((user) => ({ id: String(user.id), label: user.name }));
  const activeCount = countActiveFilters(filters);

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
        <FilterButton
          label="Workspace"
          choices={workspaceChoices}
          selected={filters.workspaceIds}
          onToggle={(id) => onChange({
            ...filters,
            workspaceIds: filters.workspaceIds.includes(id)
              ? filters.workspaceIds.filter((item) => item !== id)
              : [...filters.workspaceIds, id],
            boardIds: [],
          })}
        />
        <FilterButton
          label="Board"
          choices={boardChoices}
          selected={filters.boardIds}
          onToggle={(id) => onChange({
            ...filters,
            boardIds: filters.boardIds.includes(id)
              ? filters.boardIds.filter((item) => item !== id)
              : [...filters.boardIds, id],
          })}
        />
        <FilterButton
          label="Workflow"
          choices={WORKFLOW_CHOICES}
          selected={filters.workflow ? [filters.workflow] : []}
          onToggle={(id) => onChange({ ...filters, workflow: toggleSingle(filters.workflow, id) })}
        />
        <FilterButton
          label="Priority"
          choices={PRIORITY_CHOICES}
          selected={filters.priority ? [filters.priority] : []}
          onToggle={(id) => onChange({ ...filters, priority: toggleSingle(filters.priority, id) })}
        />
        <FilterButton
          label="Assignee"
          choices={assigneeChoices}
          selected={filters.assigneeId ? [filters.assigneeId] : []}
          onToggle={(id) => onChange({ ...filters, assigneeId: toggleSingle(filters.assigneeId, id) })}
        />
        <FilterButton
          label="Due date"
          choices={DUE_DATE_CHOICES}
          selected={filters.dueDateState ? [filters.dueDateState] : []}
          onToggle={(id) => onChange({ ...filters, dueDateState: toggleSingle(filters.dueDateState, id) })}
        />
        <DateFilterButton filters={filters} onChange={onChange} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={activeCount > 0 ? `${activeCount} active` : 'All data'}
          sx={{ height: 26, fontSize: 11.5, fontWeight: 800, bgcolor: alpha('#5F0229', 0.08), color: 'primary.main' }}
        />
        {activeCount > 0 && (
          <Button
            size="small"
            variant="text"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={() => onChange(DEFAULT_FILTERS)}
            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 800 }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export default MetricFiltersBar;
