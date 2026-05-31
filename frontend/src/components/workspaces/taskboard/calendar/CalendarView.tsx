import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Checkbox, Chip, Divider, IconButton, Paper, Popover, TextField, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { alpha } from '@mui/material/styles';
import { useTaskBoard } from '../useTaskBoard';
import type { FilterChoice, TaskFilterState } from '../taskFilters';
import {
  EMPTY_TASK_FILTERS,
  WORKFLOW_FILTER_CHOICES,
  getAssigneeFilterChoices,
  getFilterCount,
  getTagFilterChoices,
  taskMatchesFilters,
} from '../taskFilters';

type FilterKey = keyof TaskFilterState;
type CalendarMode = 'day' | 'week' | 'month';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODE_LABELS: Record<CalendarMode, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

function readStoredMode(storageKey: string): CalendarMode {
  if (typeof window === 'undefined') return 'month';
  const value = window.sessionStorage.getItem(storageKey);
  return value === 'day' || value === 'week' || value === 'month' ? value : 'month';
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonthsClamped(date: Date, months: number) {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDay));
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function readWorkflowArray(value: unknown): TaskFilterState['workflowStates'] {
  return readStringArray(value).filter((item): item is TaskFilterState['workflowStates'][number] => (
    item === 'new' || item === 'in_progress' || item === 'done' || item === 'unclassified'
  ));
}

function readStoredFilters(storageKey: string): TaskFilterState {
  if (typeof window === 'undefined') return EMPTY_TASK_FILTERS;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return EMPTY_TASK_FILTERS;

    const parsed = JSON.parse(raw) as Partial<Record<FilterKey, unknown>>;
    return {
      groupIds: readStringArray(parsed.groupIds),
      assigneeIds: readStringArray(parsed.assigneeIds),
      priorityIds: readStringArray(parsed.priorityIds),
      workflowStates: readWorkflowArray(parsed.workflowStates),
      tagIds: readStringArray(parsed.tagIds),
    };
  } catch {
    return EMPTY_TASK_FILTERS;
  }
}

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

export default function CalendarView() {
  const { tasks, groups, users, boardConfig, openPanel } = useTaskBoard();
  const filterStorageKey = `taskboard:${boardConfig.workspaceId}:calendarFilters`;
  const modeStorageKey = `taskboard:${boardConfig.workspaceId}:calendarMode`;
  const [filters, setFilters] = useState<TaskFilterState>(() => readStoredFilters(filterStorageKey));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => readStoredMode(modeStorageKey));

  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 4, 1));

  useEffect(() => {
    window.sessionStorage.setItem(filterStorageKey, JSON.stringify(filters));
  }, [filterStorageKey, filters]);

  useEffect(() => {
    window.sessionStorage.setItem(modeStorageKey, calendarMode);
  }, [modeStorageKey, calendarMode]);

  const goPrevious = () => {
    setCurrentDate((date) => {
      if (calendarMode === 'day') return addDays(date, -1);
      if (calendarMode === 'week') return addDays(date, -7);
      return addMonthsClamped(date, -1);
    });
  };

  const goNext = () => {
    setCurrentDate((date) => {
      if (calendarMode === 'day') return addDays(date, 1);
      if (calendarMode === 'week') return addDays(date, 7);
      return addMonthsClamped(date, 1);
    });
  };

  const goToday = () => setCurrentDate(new Date());
  const jumpToDate = (value: string) => {
    const nextDate = parseDateInput(value);
    if (nextDate) {
      setCurrentDate(nextDate);
    }
  };

  const taskList = useMemo(() => Object.values(tasks), [tasks]);
  const visibleTasks = useMemo(
    () => taskList.filter((task) => taskMatchesFilters(task, filters, boardConfig)),
    [taskList, filters, boardConfig]
  );
  const visibleTasksWithDates = useMemo(() => visibleTasks.filter((task) => task.dueDate), [visibleTasks]);
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

  const toggleFilter = (key: FilterKey, id: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => {
    window.sessionStorage.removeItem(filterStorageKey);
    setFilters(EMPTY_TASK_FILTERS);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const weekStart = startOfWeek(currentDate);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof visibleTasks[number][]> = {};
    visibleTasksWithDates.forEach((task) => {
      if (!task.dueDate) return;
      if (!map[task.dueDate]) map[task.dueDate] = [];
      map[task.dueDate].push(task);
    });
    return map;
  }, [visibleTasksWithDates]);

  const headerTitle = useMemo(() => {
    if (calendarMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (calendarMode === 'week') {
      const weekEnd = addDays(weekStart, 6);
      const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startLabel} - ${endLabel}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarMode, currentDate, weekStart]);

  const getDayTasks = (date: Date) => tasksByDate[formatDateKey(date)] || [];

  const rangeTaskCount = useMemo(() => {
    if (calendarMode === 'day') {
      return getDayTasks(currentDate).length;
    }
    if (calendarMode === 'week') {
      return weekDates.reduce((sum, date) => sum + getDayTasks(date).length, 0);
    }
    return Array.from({ length: daysInMonth }, (_, index) => (
      getDayTasks(new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1)).length
    )).reduce((sum, count) => sum + count, 0);
  }, [calendarMode, currentDate, daysInMonth, tasksByDate, weekDates]);

  const emptyLabel = calendarMode === 'day'
    ? 'No scheduled tasks for this day'
    : calendarMode === 'week'
      ? 'No scheduled tasks for this week'
      : 'No scheduled tasks for this month';

  const renderTask = (task: typeof visibleTasks[number]) => {
    const groupColor = groups.find((group) => group.id === task.groupId)?.color || '#5F0229';
    return (
      <Box
        key={task.id}
        onClick={() => openPanel(task.id)}
        sx={{
          bgcolor: groupColor,
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '&:hover': { opacity: 0.9 },
        }}
      >
        {task.name}
      </Box>
    );
  };

  const renderDayCell = (date: Date, options?: { minHeight?: number; showWeekday?: boolean }) => {
    const dayTasks = getDayTasks(date);
    const isToday = isSameDay(date, new Date());
    return (
      <Box
        key={formatDateKey(date)}
        sx={{
          minHeight: options?.minHeight ?? 120,
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: 'background.paper',
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: isToday ? 'primary.main' : 'text.secondary',
            mb: 0.5,
          }}
        >
          {options?.showWeekday
            ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : date.getDate()}
        </Typography>
        {dayTasks.map(renderTask)}
      </Box>
    );
  };

  const monthCells: ReactNode[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    monthCells.push(<Box key={`empty-${i}`} sx={{ minHeight: 120, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthCells.push(renderDayCell(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)));
  }
  const remaining = (7 - (monthCells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    monthCells.push(<Box key={`empty-end-${i}`} sx={{ minHeight: 120, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }} />);
  }

  const renderCalendarContent = () => {
    if (rangeTaskCount === 0) {
      return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.5 }}>
            {emptyLabel}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Clear filters, adjust the selection, or move to another {calendarMode === 'day' ? 'day' : calendarMode === 'week' ? 'week' : 'month'}.
          </Typography>
        </Paper>
      );
    }

    if (calendarMode === 'day') {
      return (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRight: 0, borderBottom: 0 }}>
          {renderDayCell(currentDate, { minHeight: 420, showWeekday: true })}
        </Paper>
      );
    }

    if (calendarMode === 'week') {
      return (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRight: 0, borderBottom: 0 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {weekDates.map((date) => renderDayCell(date, { minHeight: 360, showWeekday: true }))}
          </Box>
        </Paper>
      );
    }

    return (
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRight: 0, borderBottom: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {WEEK_DAYS.map((weekDay) => (
            <Box
              key={weekDay}
              sx={{
                py: 1.5,
                textAlign: 'center',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                {weekDay}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {monthCells}
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              overflowWrap: 'anywhere',
            }}
          >
            {headerTitle}
          </Typography>
          <Box sx={{ display: 'flex', width: 72, flexShrink: 0 }}>
            <IconButton onClick={goPrevious} size="small"><ChevronLeftIcon /></IconButton>
            <IconButton onClick={goNext} size="small"><ChevronRightIcon /></IconButton>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" onClick={goToday} sx={{ textTransform: 'none', minHeight: 32 }}>
            Today
          </Button>
          <TextField
            size="small"
            type="date"
            value={formatDateKey(currentDate)}
            onChange={(event) => jumpToDate(event.target.value)}
            inputProps={{ 'aria-label': 'Calendar date' }}
            sx={{
              width: 150,
              '& .MuiInputBase-root': { height: 32, borderRadius: 1.5, fontSize: 12.5 },
              '& input': { py: 0.75 },
            }}
          />
          <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { textTransform: 'none', minHeight: 32 } }}>
            {(Object.keys(MODE_LABELS) as CalendarMode[]).map((mode) => (
              <Button
                key={mode}
                variant={calendarMode === mode ? 'contained' : 'outlined'}
                onClick={() => setCalendarMode(mode)}
              >
                {MODE_LABELS[mode]}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

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
            label={`${visibleTasksWithDates.length} scheduled`}
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

      {renderCalendarContent()}
    </Box>
  );
}
