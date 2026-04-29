// ─── ChartView — displays charts based on task data (Section 6.2) ───

import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTaskBoard } from '../TaskBoardContext';

export default function ChartView() {
  const { tasks, groups, boardConfig } = useTaskBoard();
  const taskList = Object.values(tasks);

  // 1. Tasks by Status (Pie Chart)
  const statusData = useMemo(() => {
    const counts = taskList.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return boardConfig.statusOptions
      .map((opt) => ({
        name: opt.label,
        value: counts[opt.id] || 0,
        color: opt.color,
      }))
      .filter((d) => d.value > 0);
  }, [taskList, boardConfig.statusOptions]);

  // 2. Average Progress by Group (Horizontal Bar)
  const progressData = useMemo(() => {
    return groups.map((g) => {
      const gTasks = g.taskIds.map((id) => tasks[id]).filter(Boolean);
      const avg = gTasks.length > 0
        ? Math.round(gTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / gTasks.length)
        : 0;
      return {
        name: g.name,
        progress: avg,
        color: g.color,
      };
    });
  }, [groups, tasks]);

  // 3. Tasks by Priority (Vertical Bar)
  const priorityData = useMemo(() => {
    const counts = taskList.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return boardConfig.priorityOptions
      .map((opt) => ({
        name: opt.label,
        count: counts[opt.id] || 0,
        color: opt.color,
      }))
      .filter((d) => d.count > 0);
  }, [taskList, boardConfig.priorityOptions]);

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        
        {/* Chart A: Tasks by Status */}
        <Paper elevation={0} sx={{ flex: '1 1 300px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Tasks by Status
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Chart B: Progress by Group */}
        <Paper elevation={0} sx={{ flex: '1 1 400px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Average Progress by Group
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={progressData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Chart C: Tasks by Priority */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
          Tasks by Priority
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
