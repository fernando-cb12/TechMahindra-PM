import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, IconButton, Paper, TextField, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTaskBoard } from '../useTaskBoard';
import type { TaskFilterState } from '../taskFilters';
import {
  readStoredTaskFilters,
  taskMatchesFilters,
} from '../taskFilters';
import TaskFilterBar from '../TaskFilterBar';
import TaskCreateContextMenu from '../TaskCreateContextMenu';
import TaskActionContextMenu from '../TaskActionContextMenu';

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

export default function CalendarView() {
  const { tasks, groups, boardConfig, openPanel, updateTask } = useTaskBoard();
  const filterStorageKey = `taskboard:${boardConfig.workspaceId}:calendarFilters`;
  const modeStorageKey = `taskboard:${boardConfig.workspaceId}:calendarMode`;
  const [filters, setFilters] = useState<TaskFilterState>(() => readStoredTaskFilters(filterStorageKey));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => readStoredMode(modeStorageKey));
  const [createMenu, setCreateMenu] = useState<{ mouseX: number; mouseY: number; dueDate: string } | null>(null);
  const [taskMenu, setTaskMenu] = useState<{ mouseX: number; mouseY: number; taskId: string } | null>(null);

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

  const renderTask = (task: typeof visibleTasks[number]) => {
    const groupColor = groups.find((group) => group.id === task.groupId)?.color || '#5F0229';
    return (
      <Box
        key={task.id}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/task-id', task.id);
          event.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => openPanel(task.id)}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setTaskMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, taskId: task.id });
        }}
        sx={{
          bgcolor: groupColor,
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          cursor: 'grab',
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

  const renderDayCell = (date: Date, options?: { minHeight?: number; showWeekday?: boolean; isOutsideMonth?: boolean }) => {
    const dayTasks = getDayTasks(date);
    const isToday = isSameDay(date, new Date());
    const dateKey = formatDateKey(date);
    return (
      <Box
        key={dateKey}
        onContextMenu={(event) => {
          event.preventDefault();
          setCreateMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, dueDate: dateKey });
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(event) => {
          event.preventDefault();
          const taskId = event.dataTransfer.getData('text/task-id');
          if (taskId && tasks[taskId]?.dueDate !== dateKey) {
            updateTask(taskId, { dueDate: dateKey });
          }
        }}
        sx={{
          minHeight: options?.minHeight ?? 120,
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: options?.isOutsideMonth ? 'background.default' : 'background.paper',
          opacity: options?.isOutsideMonth ? 0.62 : 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: isToday ? 'primary.main' : options?.isOutsideMonth ? 'text.disabled' : 'text.secondary',
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
    const dayOffset = i - firstDayOfWeek + 1;
    monthCells.push(renderDayCell(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOffset), { isOutsideMonth: true }));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthCells.push(renderDayCell(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)));
  }
  const remaining = (7 - (monthCells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    monthCells.push(renderDayCell(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1), { isOutsideMonth: true }));
  }

  const renderCalendarContent = () => {
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

      <TaskFilterBar
        filters={filters}
        setFilters={setFilters}
        resultLabel={`${visibleTasksWithDates.length} scheduled`}
        storageKey={filterStorageKey}
      />

      {renderCalendarContent()}

      <TaskCreateContextMenu
        position={createMenu}
        dueDate={createMenu?.dueDate}
        onClose={() => setCreateMenu(null)}
      />
      <TaskActionContextMenu
        taskId={taskMenu?.taskId ?? null}
        position={taskMenu}
        showDateActions
        onClose={() => setTaskMenu(null)}
      />
    </Box>
  );
}
