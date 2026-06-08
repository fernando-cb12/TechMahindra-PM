import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SummaryCards, { type SummaryCardData } from '../components/dashboard/SummaryCards';
import RecentProjectsSection, {
  type RecentProjectData,
} from '../components/dashboard/RecentProjectsSection';
import RecentIssuesSection, {
  type RecentIssueData,
} from '../components/dashboard/RecentIssuesSection';
import PieDonutChart from '../components/metrics/charts/PieDonutChart';
import type { PieData } from '../components/metrics/types';
import MyTaskBoardDetailPanel from '../components/my-tasks/MyTaskBoardDetailPanel';
import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';
import { ROUTES } from '../app/routes';
import { useAuth } from '../auth/useAuth';
import { getCareerPage, type CareerPageData } from '../services/careerService';
import { myTasksDateUtils, getTasks, type MyTaskListItem, type MyTasksSummary } from '../services/myTasksService';
import { getRewardsPage, type RewardsPageData } from '../services/rewardsService';
import { getWorkspaceProjects } from '../services/workspacesService';

type DashboardState = {
  workspaces: WorkspaceProjectCardData[];
  tasks: MyTaskListItem[];
  taskSummary: MyTasksSummary;
  rewards: RewardsPageData | null;
  career: CareerPageData | null;
};

function formatDate(value: string | null) {
  if (!value) return 'No due date';
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function parseWorkspaceDate(value: string) {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Updated just now';
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Updated yesterday';
  return `Updated ${diffDays} days ago`;
}

function getTaskStatus(task: MyTaskListItem): RecentIssueData['status'] {
  if (myTasksDateUtils.isBeforeToday(task.dueDate) && task.workflow !== 'done') return 'overdue';
  if (myTasksDateUtils.isDueSoon(task.dueDate) && task.workflow !== 'done') return 'due-soon';
  if (task.workflow === 'done') return 'completed';
  return 'in-progress';
}

function getTaskPriority(task: MyTaskListItem): RecentIssueData['priority'] {
  const value = `${task.priority} ${task.priorityLabel}`.toLowerCase();
  if (value.includes('critical') || value.includes('urgent')) return 'critical';
  if (value.includes('high')) return 'high';
  if (value.includes('low')) return 'low';
  return 'medium';
}

function sortTasksForAttention(left: MyTaskListItem, right: MyTaskListItem) {
  const leftOverdue = myTasksDateUtils.isBeforeToday(left.dueDate);
  const rightOverdue = myTasksDateUtils.isBeforeToday(right.dueDate);
  if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
  const leftDueSoon = myTasksDateUtils.isDueSoon(left.dueDate);
  const rightDueSoon = myTasksDateUtils.isDueSoon(right.dueDate);
  if (leftDueSoon !== rightDueSoon) return leftDueSoon ? -1 : 1;
  if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
  if (left.dueDate) return -1;
  if (right.dueDate) return 1;
  return right.updatedAt.localeCompare(left.updatedAt);
}

function Dashboard() {
  const navigate = useNavigate();
  const { profile, hasRoleAtLeast } = useAuth();
  const [state, setState] = useState<DashboardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [workspaceResult, tasksResult, rewardsResult, careerResult] = await Promise.allSettled([
      getWorkspaceProjects(),
      getTasks(),
      getRewardsPage(),
      getCareerPage(),
    ]);

    if (workspaceResult.status === 'rejected' || tasksResult.status === 'rejected') {
      setError('We could not load the dashboard right now. Please try again.');
      setState(null);
      setIsLoading(false);
      return;
    }

    setState({
      workspaces: workspaceResult.value,
      tasks: tasksResult.value.items,
      taskSummary: tasksResult.value.summary,
      rewards: rewardsResult.status === 'fulfilled' ? rewardsResult.value : null,
      career: careerResult.status === 'fulfilled' ? careerResult.value : null,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => void loadDashboard();
    window.addEventListener('workspace:created', refresh);
    window.addEventListener('workspace:renamed', refresh);
    window.addEventListener('workspace:deleted', refresh);
    window.addEventListener('workspace:restored', refresh);
    window.addEventListener('workspace:status-changed', refresh);
    window.addEventListener('board:created', refresh);
    window.addEventListener('board:deleted', refresh);
    window.addEventListener('board:restored', refresh);

    return () => {
      window.removeEventListener('workspace:created', refresh);
      window.removeEventListener('workspace:renamed', refresh);
      window.removeEventListener('workspace:deleted', refresh);
      window.removeEventListener('workspace:restored', refresh);
      window.removeEventListener('workspace:status-changed', refresh);
      window.removeEventListener('board:created', refresh);
      window.removeEventListener('board:deleted', refresh);
      window.removeEventListener('board:restored', refresh);
    };
  }, [loadDashboard]);

  const derived = useMemo(() => {
    if (!state) return null;

    const activeWorkspaces = state.workspaces.filter((workspace) => workspace.status !== 'completed');
    const completedWorkspaces = state.workspaces.filter((workspace) => workspace.status === 'completed');
    const delayedWorkspaces = activeWorkspaces.filter(
      (workspace) => workspace.currentProgress < workspace.estimatedProgress,
    );
    const focusTasks = [...state.tasks]
      .filter((task) => task.workflow !== 'done')
      .sort(sortTasksForAttention)
      .slice(0, 5);
    const recentProjects: RecentProjectData[] = [...state.workspaces]
      .sort((left, right) => {
        if (left.status === 'in-progress' && right.status !== 'in-progress') return -1;
        if (left.status !== 'in-progress' && right.status === 'in-progress') return 1;
        const leftDue = parseWorkspaceDate(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightDue = parseWorkspaceDate(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return leftDue - rightDue;
      })
      .slice(0, 4)
      .map((workspace) => ({
        id: workspace.id,
        title: workspace.title,
        description: workspace.description,
        members: workspace.members,
        dueDate: workspace.dueDate,
        currentProgress: workspace.currentProgress,
        estimatedProgress: workspace.estimatedProgress,
        status: workspace.status,
      }));
    const operationalFocus: RecentIssueData[] = focusTasks.map((task) => ({
      taskId: task.id,
      key: task.boardName.slice(0, 3).toUpperCase() + `-${task.id}`,
      summary: task.name,
      workspace: task.workspaceName,
      board: task.boardName,
      dueLabel: task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date',
      priority: getTaskPriority(task),
      status: getTaskStatus(task),
    }));
    const recentActivity = [...state.tasks]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 6);

    return {
      activeWorkspaces,
      completedWorkspaces,
      delayedWorkspaces,
      focusTasks,
      recentProjects,
      operationalFocus,
      recentActivity,
    };
  }, [state]);

  const summaryItems = useMemo<SummaryCardData[]>(() => {
    if (!state || !derived) return [];
    return [
      {
        label: 'Active workspaces',
        value: derived.activeWorkspaces.length,
        subtitle: `${state.workspaces.length} total`,
        helper: `${derived.delayedWorkspaces.length} currently behind planned progress.`,
        icon: <FolderOpenOutlinedIcon />,
        tone: 'primary',
      },
      {
        label: 'Open tasks',
        value: state.taskSummary.open,
        subtitle: `${state.taskSummary.inProgress} in progress`,
        helper: `${state.taskSummary.assigned} tasks are assigned to you across boards.`,
        icon: <AutorenewRoundedIcon />,
        tone: 'warning',
      },
      {
        label: 'Overdue',
        value: state.taskSummary.overdue,
        subtitle: `${state.taskSummary.dueSoon} due soon`,
        helper: state.taskSummary.overdue > 0 ? 'This is the most urgent queue to review first.' : 'No overdue tasks right now.',
        icon: <WarningAmberRoundedIcon />,
        tone: state.taskSummary.overdue > 0 ? 'danger' : 'success',
      },
      {
        label: 'Completed',
        value: state.taskSummary.completed,
        subtitle: `${derived.completedWorkspaces.length} workspaces closed`,
        helper: 'Finished work and completed workspaces are reflected here.',
        icon: <AssignmentTurnedInOutlinedIcon />,
        tone: 'success',
      },
    ];
  }, [derived, state]);

  const workloadChartData = useMemo<PieData>(() => ({
    segments: [
      { label: 'Open', value: state?.taskSummary.open ?? 0 },
      { label: 'In progress', value: state?.taskSummary.inProgress ?? 0 },
      { label: 'Due soon', value: state?.taskSummary.dueSoon ?? 0 },
      { label: 'Overdue', value: state?.taskSummary.overdue ?? 0 },
      { label: 'Completed', value: state?.taskSummary.completed ?? 0 },
    ].filter((segment) => segment.value > 0),
  }), [state]);

  const selectedTask = useMemo(
    () => (selectedTaskId ? state?.tasks.find((task) => task.id === selectedTaskId) ?? null : null),
    [selectedTaskId, state?.tasks],
  );

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (error || !state || !derived) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          }
        >
          {error ?? 'Dashboard unavailable.'}
        </Alert>
      </Box>
    );
  }

  const userName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <Box sx={{ flex: 1, px: { xs: 2, sm: 4 }, py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2.5}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="h2" data-page-title="true">
            Dashboard
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              color: (theme) =>
                theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Welcome back, {userName}. Here is what needs attention today.
          </Typography>
          <Typography sx={{ mt: 1.25, maxWidth: 640, fontSize: 14, lineHeight: 1.6, color: 'text.secondary' }}>
            Track portfolio health, your delivery load, and the most urgent follow-ups from one place.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate(ROUTES.workspaces)}
              sx={{
                minHeight: 32,
                px: 2,
                borderRadius: '5px',
                bgcolor: 'primary.main',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              Open workspaces
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.issues)}
              sx={{
                minHeight: 32,
                px: 2,
                borderRadius: '5px',
                borderColor: 'primary.main',
                color: (theme) => (theme.palette.mode === 'dark' ? 'common.white' : 'primary.main'),
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.08) : alpha('#FFFFFF', 0.08),
                },
              }}
            >
              Review tasks
            </Button>
          </Stack>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', lg: 440 },
            maxWidth: '100%',
            p: { xs: 2, lg: 2.25 },
            borderRadius: '5px',
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
              Personal Snapshot
            </Typography>
            <Button
              onClick={() => navigate(ROUTES.career)}
              sx={{
                minWidth: 0,
                px: 0,
                py: 0,
                mt: -0.1,
                color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
                textTransform: 'none',
                fontWeight: 700,
                lineHeight: 1.2,
                alignSelf: 'flex-start',
              }}
            >
              Go to career
            </Button>
          </Stack>
          <Stack direction="row" spacing={1.75} sx={{ mt: 1.1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main) }}>
                {state.rewards?.balance ?? 0}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                reward points available
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 900, color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main) }}>
                {state.career?.currentXp ?? 0}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                current XP
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            useFlexGap
            sx={{ mt: 1.35, flexWrap: 'wrap' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', minWidth: 0, flex: '1 1 180px' }}>
              <EmojiEventsOutlinedIcon sx={{ fontSize: 18, color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main) }} />
              <Typography sx={{ fontSize: 13.5, lineHeight: 1.35 }}>
                {state.career
                  ? `${state.career.earnedBadges}/${state.career.totalBadges} badges unlocked`
                  : 'Career stats unavailable'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', minWidth: 0, flex: '1 1 180px' }}>
              <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 18, color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main) }} />
              <Typography sx={{ fontSize: 13.5, lineHeight: 1.35 }}>
                {state.rewards
                  ? `+${state.rewards.earnedThisMonth} points earned this month`
                  : 'Rewards activity unavailable'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <SummaryCards items={summaryItems} sx={{ mt: 2.5 }} />

      <Box
        sx={{
          mt: 2.5,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'minmax(0, 1.5fr) minmax(320px, 0.9fr)',
          },
          gap: 2,
        }}
      >
        <RecentProjectsSection
          projects={derived.recentProjects}
          delayedCount={derived.delayedWorkspaces.length}
          onOpenWorkspace={(workspaceId) => navigate(`/workspaces/${workspaceId}`)}
          onOpenAll={() => navigate(ROUTES.workspaces)}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: '5px',
            border: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
            p: 2.25,
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 900, color: 'text.primary' }}>
            Recent Activity
          </Typography>
          <Typography sx={{ mt: 0.6, fontSize: 13.5, color: 'text.secondary' }}>
            Latest movement across your assigned tasks.
          </Typography>
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            {derived.recentActivity.length > 0 ? (
              derived.recentActivity.map((task) => (
                <Box
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  sx={{
                    borderRadius: '5px',
                    px: 1.4,
                    py: 1.3,
                    border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: 'text.primary', lineHeight: 1.35 }}>
                        {task.name}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: 12.5, color: 'text.secondary' }}>
                        {task.workspaceName} • {task.boardName}
                      </Typography>
                    </Box>
                    <TaskAltOutlinedIcon sx={{ color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main), fontSize: 18, mt: 0.25 }} />
                  </Box>
                  <Typography sx={{ mt: 1, fontSize: 12.5, color: 'text.secondary' }}>
                    {formatRelativeDate(task.updatedAt)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                No recent task activity yet.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          mt: 2.5,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: 'minmax(0, 1.3fr) minmax(320px, 0.8fr)',
          },
          gap: 2,
        }}
      >
        <RecentIssuesSection
          issues={derived.operationalFocus}
          onOpenAll={() => navigate(ROUTES.issues)}
          onOpenIssue={setSelectedTaskId}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: '5px',
            border: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
            p: 2.25,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: 'text.primary' }}>
                Metrics Snapshot
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: 13.5, color: 'text.secondary', lineHeight: 1.45 }}>
                A quick metrics view of how your assigned work is distributed right now.
              </Typography>
            </Box>
            {hasRoleAtLeast('TEAM_LEAD') ? (
              <Button
                onClick={() => navigate(ROUTES.metrics)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '5px',
                  flexShrink: 0,
                  color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
                }}
              >
                Open metrics
              </Button>
            ) : null}
          </Box>

          <Box
            sx={{
              mt: 2,
              height: 260,
              borderRadius: '5px',
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
              p: 1.25,
            }}
          >
            <PieDonutChart data={workloadChartData} />
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
            <Box sx={{ px: 1.1, py: 0.7, borderRadius: '5px', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {state.taskSummary.overdue} overdue
              </Typography>
            </Box>
            <Box sx={{ px: 1.1, py: 0.7, borderRadius: '5px', bgcolor: (theme) => alpha(theme.palette.warning.main, 0.16) }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {state.taskSummary.dueSoon} due soon
              </Typography>
            </Box>
            <Box sx={{ px: 1.1, py: 0.7, borderRadius: '5px', bgcolor: (theme) => alpha(theme.palette.success.main, 0.12) }}>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {state.taskSummary.completed} completed
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <MyTaskBoardDetailPanel
        task={selectedTask}
        onClose={() => {
          setSelectedTaskId(null);
        }}
      />
    </Box>
  );
}

export default Dashboard;
