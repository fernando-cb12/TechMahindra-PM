import { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
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
import { useTaskBoard } from '../useTaskBoard';
import { resolveTaskWorkflow } from '../workflow';

const DAY_MS = 24 * 60 * 60 * 1000;

function isBeforeToday(date: string | null) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${date}T00:00:00`).getTime() < today.getTime();
}

function isDueSoon(date: string | null) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`).getTime();
  const diff = due - today.getTime();
  return diff >= 0 && diff <= 7 * DAY_MS;
}

function isStale(updatedAt: string) {
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(updated) && Date.now() - updated > 7 * DAY_MS;
}

function InsightCard({
  label,
  value,
  tone = 'default',
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'risk' | 'success';
  active?: boolean;
  onClick?: () => void;
}) {
  const color = tone === 'risk' ? '#FB485B' : tone === 'success' ? '#4CAF50' : '#5F0229';
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? '#5F0229' : 'divider',
        minWidth: 150,
        flex: '1 1 150px',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: active ? 'rgba(95, 2, 41, 0.04)' : 'background.paper',
        '&:hover': onClick ? { borderColor: '#5F0229' } : undefined,
      }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: 28, lineHeight: 1, fontWeight: 800, color }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function ChartView() {
  const { tasks, groups, boardConfig, users, openPanel } = useTaskBoard();
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const taskList = Object.values(tasks);

  const taskInsights = useMemo(() => taskList.map((task) => ({
    task,
    workflow: resolveTaskWorkflow(task, boardConfig),
  })), [taskList, boardConfig]);

  const workflowData = useMemo(() => {
    const counts = taskInsights.reduce((acc, item) => {
      acc[item.workflow] = (acc[item.workflow] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'New', value: counts.new || 0, color: '#B3B3B3' },
      { name: 'In progress', value: counts.in_progress || 0, color: '#EAC24F' },
      { name: 'Done', value: counts.done || 0, color: '#4CAF50' },
      { name: 'Unclassified', value: counts.unclassified || 0, color: '#A3334D' },
    ].filter((d) => d.value > 0);
  }, [taskInsights]);

  const summary = useMemo(() => {
    const completed = taskInsights.filter((item) => item.workflow === 'done').length;
    const inProgress = taskInsights.filter((item) => item.workflow === 'in_progress').length;
    const newlyCreated = taskInsights.filter((item) => item.workflow === 'new').length;
    const unclassified = taskInsights.filter((item) => item.workflow === 'unclassified').length;
    const open = taskInsights.length - completed;
    const overdue = taskInsights.filter((item) => item.workflow !== 'done' && isBeforeToday(item.task.dueDate)).length;
    const dueSoon = taskInsights.filter((item) => item.workflow !== 'done' && isDueSoon(item.task.dueDate)).length;

    return { total: taskInsights.length, open, completed, inProgress, newlyCreated, overdue, dueSoon, unclassified };
  }, [taskInsights]);

  const groupData = useMemo(() => {
    return groups.map((group) => {
      const groupTasks = group.taskIds.map((id) => tasks[id]).filter(Boolean);
      const completed = groupTasks.filter((task) => resolveTaskWorkflow(task, boardConfig) === 'done').length;
      const progress = groupTasks.length > 0 ? Math.round((completed / groupTasks.length) * 100) : 0;
      return {
        name: group.name,
        progress,
        tasks: groupTasks.length,
        color: group.color,
      };
    });
  }, [groups, tasks, boardConfig]);

  const priorityData = useMemo(() => {
    const openTasks = taskInsights.filter((item) => item.workflow !== 'done').map((item) => item.task);
    const counts = openTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return boardConfig.priorityOptions
      .map((option) => ({
        name: option.label,
        count: counts[option.id] || 0,
        color: option.color,
      }))
      .filter((item) => item.count > 0);
  }, [taskInsights, boardConfig.priorityOptions]);

  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of taskInsights) {
      if (item.workflow === 'done') continue;
      const assignees = item.task.assigneeIds.length ? item.task.assigneeIds : item.task.assigneeId ? [item.task.assigneeId] : ['unassigned'];
      for (const userId of assignees) {
        counts[userId] = (counts[userId] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([userId, count]) => ({ name: users[userId]?.name || 'Unassigned', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [taskInsights, users]);

  const riskTasks = useMemo(() => (
    taskInsights
      .filter((item) => item.workflow !== 'done')
      .filter((item) => isBeforeToday(item.task.dueDate) || isStale(item.task.updatedAt))
      .slice(0, 6)
  ), [taskInsights]);

  const insightDefinitions = useMemo(() => [
    { id: 'total', label: 'Total tasks', value: summary.total, tasks: taskInsights.map((item) => item.task) },
    { id: 'open', label: 'Open', value: summary.open, tasks: taskInsights.filter((item) => item.workflow !== 'done').map((item) => item.task) },
    { id: 'completed', label: 'Completed', value: summary.completed, tone: 'success' as const, tasks: taskInsights.filter((item) => item.workflow === 'done').map((item) => item.task) },
    { id: 'new', label: 'New', value: summary.newlyCreated, tasks: taskInsights.filter((item) => item.workflow === 'new').map((item) => item.task) },
    { id: 'in_progress', label: 'In progress', value: summary.inProgress, tasks: taskInsights.filter((item) => item.workflow === 'in_progress').map((item) => item.task) },
    { id: 'overdue', label: 'Overdue', value: summary.overdue, tone: 'risk' as const, tasks: taskInsights.filter((item) => item.workflow !== 'done' && isBeforeToday(item.task.dueDate)).map((item) => item.task) },
    { id: 'due_soon', label: 'Due soon', value: summary.dueSoon, tasks: taskInsights.filter((item) => item.workflow !== 'done' && isDueSoon(item.task.dueDate)).map((item) => item.task) },
    { id: 'unclassified', label: 'Unclassified', value: summary.unclassified, tasks: taskInsights.filter((item) => item.workflow === 'unclassified').map((item) => item.task) },
  ], [summary, taskInsights]);

  const selectedInsightData = insightDefinitions.find((item) => item.id === selectedInsight);

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Insights
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
          Board health, delivery risk, and workload signals based on mapped workflow meanings.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {insightDefinitions.map((insight) => (
          <InsightCard
            key={insight.id}
            label={insight.label}
            value={insight.value}
            tone={insight.tone}
            active={selectedInsight === insight.id}
            onClick={() => setSelectedInsight((current) => (current === insight.id ? null : insight.id))}
          />
        ))}
      </Box>

      {selectedInsightData && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{selectedInsightData.label}</Typography>
            <Button size="small" onClick={() => setSelectedInsight(null)} sx={{ textTransform: 'none' }}>
              Clear
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {selectedInsightData.tasks.slice(0, 10).map((task) => (
              <Box
                key={task.id}
                onClick={() => openPanel(task.id)}
                sx={{ px: 1, py: 0.75, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{task.name}</Typography>
              </Box>
            ))}
            {selectedInsightData.tasks.length === 0 && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No tasks in this insight.</Typography>
            )}
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Paper elevation={0} sx={{ flex: '1 1 300px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Workflow Breakdown
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={workflowData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {workflowData.map((entry, index) => (
                    <Cell key={`workflow-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ flex: '1 1 400px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Completion by Group
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={groupData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                  {groupData.map((entry, index) => (
                    <Cell key={`group-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Paper elevation={0} sx={{ flex: '1 1 420px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Open Tasks by Priority
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`priority-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ flex: '1 1 320px', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
            Workload by Assignee
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {workloadData.map((item) => (
              <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </Typography>
                <Chip size="small" label={item.count} sx={{ fontWeight: 700 }} />
              </Box>
            ))}
            {workloadData.length === 0 && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No open assigned tasks.</Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
          Risk Watchlist
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {riskTasks.map(({ task }) => (
            <Box
              key={task.id}
              onClick={() => openPanel(task.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{task.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isBeforeToday(task.dueDate) && <Chip size="small" label="Overdue" color="error" />}
                {isStale(task.updatedAt) && <Chip size="small" label="Stale" />}
              </Box>
            </Box>
          ))}
          {riskTasks.length === 0 && (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No overdue or stale open tasks.</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
