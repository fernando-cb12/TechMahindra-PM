// ─── CalendarView — displays tasks on a monthly calendar (Section 6.3) ───

import { useMemo, useState } from 'react';
import { Box, Typography, IconButton, Paper, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTaskBoard } from '../useTaskBoard';

export default function CalendarView() {
  const { tasks, groups, openPanel } = useTaskBoard();
  
  // Set default to first task's due date if possible, otherwise today
  // Mock data has dates in "2026-05" range mostly
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date(2026, 4, 1); // May 2026 to match mocks
  });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Map tasks to dates
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks[string][]> = {};
    Object.values(tasks).forEach((t) => {
      if (!t.dueDate) return;
      // dueDate is YYYY-MM-DD
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<Box key={`empty-${i}`} sx={{ minHeight: 120, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateStr] || [];

    cells.push(
      <Box
        key={`day-${d}`}
        sx={{
          minHeight: 120,
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
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
          {d}
        </Typography>
        {dayTasks.map((t) => {
          const groupColor = groups.find((g) => g.id === t.groupId)?.color || '#5F0229';
          return (
            <Box
              key={t.id}
              onClick={() => openPanel(t.id)}
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
              {t.name}
            </Box>
          );
        })}
      </Box>
    );
  }

  // Fill remaining cells
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    cells.push(<Box key={`empty-end-${i}`} sx={{ minHeight: 120, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }} />);
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{monthName}</Typography>
          <Box>
            <IconButton onClick={prevMonth} size="small"><ChevronLeftIcon /></IconButton>
            <IconButton onClick={nextMonth} size="small"><ChevronRightIcon /></IconButton>
          </Box>
        </Box>
        <Button variant="outlined" size="small" onClick={goToday} sx={{ textTransform: 'none' }}>
          Today
        </Button>
      </Box>

      {/* Grid */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRight: 0, borderBottom: 0 }}>
        {/* Days Header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDays.map((wd) => (
            <Box
              key={wd}
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
                {wd}
              </Typography>
            </Box>
          ))}
        </Box>
        {/* Days Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells}
        </Box>
      </Paper>
    </Box>
  );
}
