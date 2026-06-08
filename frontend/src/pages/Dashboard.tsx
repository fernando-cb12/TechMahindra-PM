import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BoltIcon from '@mui/icons-material/Bolt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, type Theme, useTheme } from '@mui/material/styles';
import MyTaskBoardDetailPanel from '../components/my-tasks/MyTaskBoardDetailPanel';
import type { WorkspaceProjectCardData } from '../components/workspaces/WorkspaceProjectCard';
import { ROUTES } from '../app/routes';
import { useAuth } from '../auth/useAuth';
import { getCareerPage, type CareerPageData } from '../services/careerService';
import { getTasks, myTasksDateUtils, type MyTaskListItem, type MyTasksSummary } from '../services/myTasksService';
import { getRewardsPage, type RewardsPageData } from '../services/rewardsService';
import { getWorkspaceProjects } from '../services/workspacesService';

type DashboardState = {
  workspaces: WorkspaceProjectCardData[];
  tasks: MyTaskListItem[];
  taskSummary: MyTasksSummary;
  career: CareerPageData | null;
  rewards: RewardsPageData | null;
};

type RiskWorkspace = WorkspaceProjectCardData & {
  riskScore: number;
  overdueTasks: number;
  dueSoonTasks: number;
  behindBy: number;
  reasons: string[];
};

function formatDate(value: string | null) {
  if (!value) return 'No due date';
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
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
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function getPriorityWeight(task: MyTaskListItem) {
  const value = `${task.priority} ${task.priorityLabel}`.toLowerCase();
  if (value.includes('critical') || value.includes('urgent')) return 4;
  if (value.includes('high')) return 3;
  if (value.includes('medium')) return 2;
  return 1;
}

function getAttentionReason(task: MyTaskListItem) {
  if (myTasksDateUtils.isBeforeToday(task.dueDate)) return 'Overdue';
  if (myTasksDateUtils.isDueSoon(task.dueDate)) return 'Due soon';
  if (myTasksDateUtils.isStale(task.updatedAt)) return 'Stale';
  if (getPriorityWeight(task) >= 3) return task.priorityLabel || 'High priority';
  return 'Active';
}

function sortTasksForAttention(left: MyTaskListItem, right: MyTaskListItem) {
  const leftOverdue = myTasksDateUtils.isBeforeToday(left.dueDate);
  const rightOverdue = myTasksDateUtils.isBeforeToday(right.dueDate);
  if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

  const leftDueSoon = myTasksDateUtils.isDueSoon(left.dueDate);
  const rightDueSoon = myTasksDateUtils.isDueSoon(right.dueDate);
  if (leftDueSoon !== rightDueSoon) return leftDueSoon ? -1 : 1;

  const priorityDiff = getPriorityWeight(right) - getPriorityWeight(left);
  if (priorityDiff !== 0) return priorityDiff;

  if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
  if (left.dueDate) return -1;
  if (right.dueDate) return 1;
  return right.updatedAt.localeCompare(left.updatedAt);
}

function dashboardBorder(theme: Theme) {
  return theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.22)
    : alpha(theme.palette.grey[900], 0.18);
}

function dashboardIconColor(theme: Theme) {
  return theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main;
}

function Panel({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '5px',
        border: (theme) => `2px solid ${dashboardBorder(theme)}`,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? `0 18px 44px ${alpha(theme.palette.common.black, 0.24)}`
          : `0 12px 30px ${alpha(theme.palette.grey[900], 0.06)}`,
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.65, fontSize: 13.5, color: 'text.secondary', lineHeight: 1.45 }}>
          {subtitle}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

function DashboardActionButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Button
      size="small"
      onClick={onClick}
      endIcon={icon}
      sx={{
        textTransform: 'none',
        fontWeight: 800,
        borderRadius: '5px',
        flexShrink: 0,
        color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main),
        '& .MuiButton-endIcon': {
          color: (theme) => dashboardIconColor(theme),
        },
      }}
    >
      {children}
    </Button>
  );
}

function HealthMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const theme = useTheme();
  const iconColor = dashboardIconColor(theme);

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.4,
        borderRadius: '5px',
        border: `2px solid ${dashboardBorder(theme)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {label}
        </Typography>
        <Box sx={{ color: iconColor, display: 'grid', placeItems: 'center' }}>{icon}</Box>
      </Box>
      <Typography sx={{ mt: 1, fontSize: 30, lineHeight: 1, fontWeight: 950, color: 'text.primary' }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.7, fontSize: 12.5, lineHeight: 1.35, color: 'text.secondary' }}>
        {helper}
      </Typography>
    </Box>
  );
}

function PortfolioHealthPanel({
  activeCount,
  riskCount,
  overdueCount,
  openCount,
  completedCount,
  healthLabel,
  healthTone,
  healthCopy,
}: {
  activeCount: number;
  riskCount: number;
  overdueCount: number;
  openCount: number;
  completedCount: number;
  healthLabel: string;
  healthTone: 'success' | 'warning' | 'danger';
  healthCopy: string;
}) {
  const theme = useTheme();
  const toneColor = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    danger: theme.palette.error.main,
  }[healthTone];

  return (
    <Panel
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, md: 2.5 },
        pb: { xs: 2.6, md: 3.1 },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 5,
          bgcolor: 'primary.main',
          borderBottomLeftRadius: '5px',
          borderBottomRightRadius: '5px',
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, 0.7fr) minmax(0, 1.4fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 190,
          }}
        >
          <Chip
            label={healthLabel}
            size="small"
            sx={{
              height: 26,
              alignSelf: 'flex-start',
              borderRadius: '5px',
              border: `1px solid ${alpha(toneColor, 0.35)}`,
              bgcolor: 'transparent',
              color: toneColor,
              fontWeight: 900,
            }}
          />
          <Typography sx={{ mt: 1.4, fontSize: { xs: 28, md: 34 }, fontWeight: 950, lineHeight: 1.08, color: 'text.primary' }}>
            Portfolio health
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 14, lineHeight: 1.55 }}>
            {healthCopy}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
            gap: 1.4,
          }}
        >
          <HealthMetric label="Active workspaces" value={activeCount} helper="Projects currently in motion." icon={<FolderOpenOutlinedIcon />} />
          <HealthMetric label="At risk" value={riskCount} helper="Behind plan or carrying urgent tasks." icon={<WarningAmberRoundedIcon />} tone={riskCount > 0 ? 'danger' : 'success'} />
          <HealthMetric label="Overdue tasks" value={overdueCount} helper="Needs attention before new work." icon={<AssignmentLateOutlinedIcon />} tone={overdueCount > 0 ? 'danger' : 'success'} />
          <HealthMetric label="Open load" value={openCount} helper={`${completedCount} completed in your queue.`} icon={<AutorenewRoundedIcon />} tone="warning" />
        </Box>
      </Box>
    </Panel>
  );
}

function AttentionList({
  tasks,
  onOpenTask,
  onOpenAll,
}: {
  tasks: MyTaskListItem[];
  onOpenTask: (taskId: string) => void;
  onOpenAll: () => void;
}) {
  const theme = useTheme();

  return (
    <Panel sx={{ p: 2.25 }}>
      <SectionHeader
        title="Needs Attention Today"
        subtitle="A curated queue of overdue, due-soon, stale, or high-priority tasks."
        action={<DashboardActionButton onClick={onOpenAll} icon={<ArrowForwardRoundedIcon />}>Open tasks</DashboardActionButton>}
      />
      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {tasks.length > 0 ? tasks.map((task) => {
          const reason = getAttentionReason(task);
          const isUrgent = reason === 'Overdue' || getPriorityWeight(task) >= 4;
          return (
            <Box
              key={task.id}
              onClick={() => onOpenTask(task.id)}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                gap: 1.25,
                alignItems: 'center',
                px: 1.5,
                py: 1.35,
                borderRadius: '5px',
                cursor: 'pointer',
                border: `2px solid ${dashboardBorder(theme)}`,
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: isUrgent ? 'error.main' : 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.035),
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
                  <Chip
                    label={reason}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: '5px',
                      border: `1px solid ${isUrgent ? alpha(theme.palette.error.main, 0.35) : alpha(theme.palette.primary.main, 0.28)}`,
                      bgcolor: 'transparent',
                      color: isUrgent ? 'error.main' : 'primary.main',
                      '& .MuiChip-label': { fontSize: 10.5, fontWeight: 900, px: 0.8 },
                    }}
                  />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: 'text.secondary' }}>
                    {task.workspaceName} / {task.boardName}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 0.75, fontSize: 15, fontWeight: 900, lineHeight: 1.3, color: 'text.primary' }}>
                  {task.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'space-between', md: 'flex-end' }, gap: 1, alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 700 }}>
                  {formatDate(task.dueDate)}
                </Typography>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: dashboardIconColor(theme) }} />
              </Box>
            </Box>
          );
        }) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircleOutlineRoundedIcon sx={{ color: dashboardIconColor(theme), fontSize: 30, mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 700 }}>
              Nothing needs urgent attention right now.
            </Typography>
          </Box>
        )}
      </Stack>
    </Panel>
  );
}

function RiskProjects({
  projects,
  onOpenWorkspace,
  onOpenAll,
}: {
  projects: RiskWorkspace[];
  onOpenWorkspace: (workspaceId: string) => void;
  onOpenAll: () => void;
}) {
  const theme = useTheme();

  return (
    <Panel sx={{ p: 2.25 }}>
      <SectionHeader
        title="Projects at Risk"
        subtitle="Workspaces most likely to need lead intervention."
        action={<DashboardActionButton onClick={onOpenAll}>View all</DashboardActionButton>}
      />
      <Stack spacing={1.35} sx={{ mt: 2 }}>
        {projects.length > 0 ? projects.map((project) => {
          const isBehind = project.behindBy > 0;
          return (
            <Box
              key={project.id}
              onClick={() => onOpenWorkspace(project.id)}
              sx={{
                p: 1.45,
                borderRadius: '5px',
                border: `2px solid ${dashboardBorder(theme)}`,
                bgcolor: 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.035),
                  borderColor: 'primary.main',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, color: 'text.primary', lineHeight: 1.3 }}>
                    {project.title}
                  </Typography>
                  <Typography sx={{ mt: 0.45, fontSize: 12.5, color: 'text.secondary' }}>
                    {project.reasons.join(' / ')}
                  </Typography>
                </Box>
                <Chip
                  label={isBehind ? `${project.behindBy}% behind` : 'Watch'}
                  size="small"
                  sx={{
                    borderRadius: '5px',
                    height: 23,
                    border: `1px solid ${isBehind ? alpha(theme.palette.error.main, 0.35) : alpha(theme.palette.warning.main, 0.35)}`,
                    bgcolor: 'transparent',
                    color: isBehind ? 'error.main' : 'warning.main',
                    '& .MuiChip-label': { fontSize: 10.5, fontWeight: 900 },
                  }}
                />
              </Box>

              <Box sx={{ mt: 1.35 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 800 }}>
                    Progress
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.primary', fontWeight: 900 }}>
                    {project.currentProgress}% / {project.estimatedProgress}% plan
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(project.currentProgress, 100)}
                  sx={{
                    height: 7,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      bgcolor: isBehind ? 'warning.main' : 'primary.main',
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', mt: 1.25, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65 }}>
                  <GroupOutlinedIcon sx={{ fontSize: 15, color: dashboardIconColor(theme) }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{project.members.length} members</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65 }}>
                  <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: dashboardIconColor(theme) }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Due {formatDate(project.dueDate)}</Typography>
                </Box>
              </Box>
            </Box>
          );
        }) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircleOutlineRoundedIcon sx={{ color: dashboardIconColor(theme), fontSize: 30, mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 700 }}>
              No project risk detected.
            </Typography>
          </Box>
        )}
      </Stack>
    </Panel>
  );
}

function WorkloadSnapshot({
  boardWorkload,
  summary,
}: {
  boardWorkload: Array<{ key: string; boardName: string; workspaceName: string; open: number; overdue: number; dueSoon: number }>;
  summary: MyTasksSummary;
}) {
  const maxOpen = Math.max(1, ...boardWorkload.map((item) => item.open));

  return (
    <Panel sx={{ p: 2.25 }}>
      <SectionHeader
        title="Workload Snapshot"
        subtitle="A quick read on where delivery load is concentrated."
      />
      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.2 }}>
        <HealthMetric label="Open" value={summary.open} helper={`${summary.inProgress} in progress`} icon={<AutorenewRoundedIcon />} tone="warning" />
        <HealthMetric label="Due soon" value={summary.dueSoon} helper="Needs scheduling attention." icon={<CalendarMonthOutlinedIcon />} tone="warning" />
        <HealthMetric label="Stale" value={summary.stale} helper="No recent movement." icon={<TrendingDownRoundedIcon />} tone={summary.stale > 0 ? 'danger' : 'success'} />
      </Box>
      <Stack spacing={1.1} sx={{ mt: 2 }}>
        {boardWorkload.length > 0 ? boardWorkload.slice(0, 4).map((item) => (
          <Box key={item.key}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.65 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: 'text.primary' }}>
                {item.boardName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {item.open} open
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(item.open / maxOpen) * 100}
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: item.overdue > 0 ? 'error.main' : 'primary.main' },
              }}
            />
            <Typography sx={{ mt: 0.45, fontSize: 11.5, color: 'text.secondary' }}>
              {item.workspaceName}
              {item.overdue > 0 ? ` / ${item.overdue} overdue` : item.dueSoon > 0 ? ` / ${item.dueSoon} due soon` : ''}
            </Typography>
          </Box>
        )) : (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No active workload found.
          </Typography>
        )}
      </Stack>
    </Panel>
  );
}

function RecentMovement({
  tasks,
  onOpenTask,
}: {
  tasks: MyTaskListItem[];
  onOpenTask: (taskId: string) => void;
}) {
  const theme = useTheme();

  return (
    <Panel sx={{ p: 2.25 }}>
      <SectionHeader title="Recent Movement" subtitle="Latest task changes for context." />
      <Stack spacing={1.15} sx={{ mt: 2 }}>
        {tasks.length > 0 ? tasks.slice(0, 5).map((task) => (
          <Box
            key={task.id}
            onClick={() => onOpenTask(task.id)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.15,
              p: 1.2,
              borderRadius: '5px',
              cursor: 'pointer',
              '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.05) },
            }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'transparent',
                border: `1px solid ${dashboardBorder(theme)}`,
                color: dashboardIconColor(theme),
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {task.name.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: 'text.primary', lineHeight: 1.25 }} noWrap>
                {task.name}
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 11.5, color: 'text.secondary' }}>
                {task.workspaceName} / {task.boardName}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: 'text.disabled', flexShrink: 0 }}>
              {formatRelativeDate(task.updatedAt)}
            </Typography>
          </Box>
        )) : (
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No recent task activity yet.
          </Typography>
        )}
      </Stack>
    </Panel>
  );
}

function PersonalStatsPopover({
  anchorEl,
  career,
  rewards,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  career: CareerPageData | null;
  rewards: RewardsPageData | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const isOpen = Boolean(anchorEl);
  const currentRank = career?.ranks.find((rank) => rank.current);
  const multiplier = career?.stats.find((stat) => stat.id === 'multiplier')?.value ?? '1x';
  const xpMax = Math.max(career?.maxXp ?? 1, 1);
  const xpValue = career?.currentXp ?? 0;

  const stats = [
    {
      label: 'Reward points',
      value: rewards?.balance?.toLocaleString() ?? '0',
      helper: `${rewards?.earnedThisMonth?.toLocaleString() ?? '0'} earned this month`,
      icon: <PaidOutlinedIcon />,
    },
    {
      label: 'Current XP',
      value: xpValue.toLocaleString(),
      helper: `${Math.round((xpValue / xpMax) * 100)}% to next rank`,
      icon: <EmojiEventsOutlinedIcon />,
    },
    {
      label: 'Multiplier',
      value: multiplier,
      helper: 'Career points boost',
      icon: <BoltIcon />,
    },
  ];

  return (
    <Popover
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            borderRadius: '5px',
            border: `2px solid ${dashboardBorder(theme)}`,
            bgcolor: 'background.paper',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 22px 54px ${alpha(theme.palette.common.black, 0.42)}`
              : `0 18px 46px ${alpha(theme.palette.grey[900], 0.14)}`,
          },
        },
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 950, color: 'text.primary', lineHeight: 1.2 }}>
              Personal stats
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 12.5, color: 'text.secondary' }}>
              {currentRank?.label ?? 'Current rank'} / quick progress snapshot
            </Typography>
          </Box>
          <Chip
            label={`${career?.earnedBadges ?? 0}/${career?.totalBadges ?? 0} badges`}
            size="small"
            sx={{
              borderRadius: '5px',
              border: `1px solid ${dashboardBorder(theme)}`,
              bgcolor: 'transparent',
              color: 'text.primary',
              fontWeight: 900,
            }}
          />
        </Box>

        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
          {stats.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 1.25,
                borderRadius: '5px',
                border: `2px solid ${dashboardBorder(theme)}`,
                bgcolor: 'background.paper',
                minWidth: 0,
              }}
            >
              <Box sx={{ color: dashboardIconColor(theme), display: 'grid', placeItems: 'center', width: 24, height: 24 }}>
                {stat.icon}
              </Box>
              <Typography sx={{ mt: 1, fontSize: 22, lineHeight: 1, fontWeight: 950, color: 'text.primary' }}>
                {stat.value}
              </Typography>
              <Typography sx={{ mt: 0.65, fontSize: 10.5, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
                {stat.label}
              </Typography>
              <Typography sx={{ mt: 0.45, fontSize: 11.5, color: 'text.secondary', lineHeight: 1.35 }}>
                {stat.helper}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2, borderColor: dashboardBorder(theme), borderBottomWidth: 2 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 900 }}>
              Rank progress
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.primary', fontWeight: 900 }}>
              {xpValue.toLocaleString()} / {xpMax.toLocaleString()} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, career?.rankProgress ?? (xpValue / xpMax) * 100))}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: alpha(dashboardIconColor(theme), theme.palette.mode === 'dark' ? 0.18 : 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                bgcolor: dashboardIconColor(theme),
              },
            }}
          />
        </Box>
      </Box>
    </Popover>
  );
}

function PersonalStatsPanel({
  career,
  rewards,
}: {
  career: CareerPageData | null;
  rewards: RewardsPageData | null;
}) {
  const theme = useTheme();
  const currentRank = career?.ranks.find((rank) => rank.current);
  const multiplier = career?.stats.find((stat) => stat.id === 'multiplier')?.value ?? '1x';
  const xpMax = Math.max(career?.maxXp ?? 1, 1);
  const xpValue = career?.currentXp ?? 0;
  const rankProgress = Math.min(100, Math.max(0, career?.rankProgress ?? (xpValue / xpMax) * 100));

  return (
    <Panel sx={{ p: 2.05 }}>
      <SectionHeader
        title="Your Stats"
        subtitle="XP and rewards progress."
      />

      <Box sx={{ mt: 1.65 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 900, textTransform: 'uppercase' }}>
              {currentRank?.label ?? 'Current rank'}
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: { xs: 34, md: 40 }, lineHeight: 1, fontWeight: 950, color: 'text.primary' }}>
              {xpValue.toLocaleString()} XP
            </Typography>
          </Box>
          <Chip
            label={`${Math.round(rankProgress)}%`}
            size="small"
            sx={{
              borderRadius: '5px',
              border: `1px solid ${dashboardBorder(theme)}`,
              bgcolor: 'transparent',
              color: 'text.primary',
              fontWeight: 900,
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={rankProgress}
          sx={{
            mt: 1.25,
            height: 8,
            borderRadius: 999,
            bgcolor: alpha(dashboardIconColor(theme), theme.palette.mode === 'dark' ? 0.18 : 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              bgcolor: dashboardIconColor(theme),
            },
          }}
        />
        <Typography sx={{ mt: 0.9, fontSize: 12.5, color: 'text.secondary' }}>
          {xpValue.toLocaleString()} / {xpMax.toLocaleString()} XP toward the next rank.
        </Typography>
      </Box>

      <Box sx={{ mt: 1.45, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.9 }}>
        {[
          { label: 'Rewards', value: rewards?.balance?.toLocaleString() ?? 0, icon: <PaidOutlinedIcon /> },
          { label: 'Multiplier', value: multiplier, icon: <BoltIcon /> },
          { label: 'Badges', value: `${career?.earnedBadges ?? 0}/${career?.totalBadges ?? 0}`, icon: <EmojiEventsOutlinedIcon /> },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              p: 1,
              borderRadius: '5px',
              border: `2px solid ${dashboardBorder(theme)}`,
              bgcolor: 'background.paper',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: dashboardIconColor(theme) }}>
              {item.icon}
              <Typography sx={{ fontSize: 18, lineHeight: 1, fontWeight: 950, color: 'text.primary' }}>
                {item.value}
              </Typography>
            </Box>
            <Typography sx={{ mt: 0.6, fontSize: 10.5, fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}

function DeveloperTaskQueue({
  tasks,
  onOpenTask,
  onOpenAll,
}: {
  tasks: MyTaskListItem[];
  onOpenTask: (taskId: string) => void;
  onOpenAll: () => void;
}) {
  const theme = useTheme();
  const visibleTasks = tasks.slice(0, 8);

  return (
    <Panel sx={{ p: 2.25 }}>
      <SectionHeader
        title="Your Priority Queue"
        subtitle="Tasks assigned to you, sorted by due date, risk, and priority."
        action={<DashboardActionButton onClick={onOpenAll} icon={<ArrowForwardRoundedIcon />}>Open tasks</DashboardActionButton>}
      />
      <Stack spacing={1.15} sx={{ mt: 2 }}>
        {visibleTasks.length > 0 ? visibleTasks.map((task) => {
          const reason = getAttentionReason(task);
          const urgent = reason === 'Overdue' || getPriorityWeight(task) >= 4;
          return (
            <Box
              key={task.id}
              onClick={() => onOpenTask(task.id)}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                gap: 1.2,
                alignItems: 'center',
                p: 1.35,
                borderRadius: '5px',
                border: `2px solid ${dashboardBorder(theme)}`,
                bgcolor: 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: urgent ? 'error.main' : 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.035),
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    label={reason}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: '5px',
                      border: `1px solid ${urgent ? alpha(theme.palette.error.main, 0.35) : alpha(theme.palette.primary.main, 0.28)}`,
                      bgcolor: 'transparent',
                      color: urgent ? 'error.main' : 'primary.main',
                      '& .MuiChip-label': { fontSize: 10.5, fontWeight: 900, px: 0.8 },
                    }}
                  />
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: 'text.secondary' }}>
                    {task.workspaceName} / {task.boardName}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 0.75, fontSize: 15, fontWeight: 900, color: 'text.primary', lineHeight: 1.3 }}>
                  {task.name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 92 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 900, color: 'text.primary' }}>
                  {formatDate(task.dueDate)}
                </Typography>
                <Typography sx={{ mt: 0.3, fontSize: 11.5, color: 'text.secondary' }}>
                  {task.priorityLabel || 'Priority'}
                </Typography>
              </Box>
            </Box>
          );
        }) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircleOutlineRoundedIcon sx={{ color: dashboardIconColor(theme), fontSize: 30, mb: 1 }} />
            <Typography sx={{ color: 'text.secondary', fontSize: 14, fontWeight: 700 }}>
              No assigned task needs attention right now.
            </Typography>
          </Box>
        )}
      </Stack>
    </Panel>
  );
}

function DeveloperDashboard({
  state,
  userName,
  priorityTasks,
  recentTasks,
  onOpenTask,
  onOpenAllTasks,
}: {
  state: DashboardState;
  userName: string;
  priorityTasks: MyTaskListItem[];
  recentTasks: MyTaskListItem[];
  onOpenTask: (taskId: string) => void;
  onOpenAllTasks: () => void;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" data-page-title="true">
            Dashboard
          </Typography>
          <Typography sx={{ mt: 0.45, color: 'text.secondary', fontSize: 14.5, lineHeight: 1.55 }}>
            Welcome back, {userName}. Your assigned work, priorities, and growth at a glance.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2.5,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.25fr) minmax(380px, 0.75fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <DeveloperTaskQueue
          tasks={priorityTasks}
          onOpenTask={onOpenTask}
          onOpenAll={onOpenAllTasks}
        />
        <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
          <Box sx={{ flex: '0 0 auto' }}>
            <PersonalStatsPanel career={state.career} rewards={state.rewards} />
          </Box>
          <Panel sx={{ p: 2.05, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <SectionHeader title="My Workload" subtitle="Quick counters for your active queue." />
            <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1, flex: 1 }}>
              <HealthMetric label="Open" value={state.taskSummary.open} helper={`${state.taskSummary.inProgress} in progress`} icon={<AutorenewRoundedIcon />} />
              <HealthMetric label="Due soon" value={state.taskSummary.dueSoon} helper="Needs planning today." icon={<CalendarMonthOutlinedIcon />} />
              <HealthMetric label="Overdue" value={state.taskSummary.overdue} helper="Review first." icon={<AssignmentLateOutlinedIcon />} />
              <HealthMetric label="Completed" value={state.taskSummary.completed} helper="Finished work." icon={<CheckCircleOutlineRoundedIcon />} />
            </Box>
          </Panel>
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        <RecentMovement tasks={recentTasks} onOpenTask={onOpenTask} />
      </Box>
    </>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { profile, hasRoleAtLeast } = useAuth();
  const [state, setState] = useState<DashboardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statsAnchorEl, setStatsAnchorEl] = useState<HTMLElement | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [workspaceResult, tasksResult, careerResult, rewardsResult] = await Promise.allSettled([
      getWorkspaceProjects(),
      getTasks(),
      getCareerPage(),
      getRewardsPage(),
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
      career: careerResult.status === 'fulfilled' ? careerResult.value : null,
      rewards: rewardsResult.status === 'fulfilled' ? rewardsResult.value : null,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refresh = () => void loadDashboard();
    window.addEventListener('workspace:created', refresh);
    window.addEventListener('workspace:renamed', refresh);
    window.addEventListener('workspace:deleted', refresh);
    window.addEventListener('workspace:restored', refresh);
    window.addEventListener('workspace:status-changed', refresh);
    window.addEventListener('workspace:tasks-changed', refresh);
    window.addEventListener('board:created', refresh);
    window.addEventListener('board:deleted', refresh);
    window.addEventListener('board:restored', refresh);

    return () => {
      window.removeEventListener('workspace:created', refresh);
      window.removeEventListener('workspace:renamed', refresh);
      window.removeEventListener('workspace:deleted', refresh);
      window.removeEventListener('workspace:restored', refresh);
      window.removeEventListener('workspace:status-changed', refresh);
      window.removeEventListener('workspace:tasks-changed', refresh);
      window.removeEventListener('board:created', refresh);
      window.removeEventListener('board:deleted', refresh);
      window.removeEventListener('board:restored', refresh);
    };
  }, [loadDashboard]);

  const derived = useMemo(() => {
    if (!state) return null;

    const activeWorkspaces = state.workspaces.filter((workspace) => workspace.status !== 'completed');
    const completedWorkspaces = state.workspaces.filter((workspace) => workspace.status === 'completed');
    const tasksByWorkspace = state.tasks.reduce<Record<string, MyTaskListItem[]>>((acc, task) => {
      acc[task.workspaceId] ??= [];
      acc[task.workspaceId].push(task);
      return acc;
    }, {});

    const riskProjects: RiskWorkspace[] = activeWorkspaces
      .map((workspace) => {
        const workspaceTasks = tasksByWorkspace[workspace.id] ?? [];
        const overdueTasks = workspaceTasks.filter((task) => task.workflow !== 'done' && myTasksDateUtils.isBeforeToday(task.dueDate)).length;
        const dueSoonTasks = workspaceTasks.filter((task) => task.workflow !== 'done' && myTasksDateUtils.isDueSoon(task.dueDate)).length;
        const behindBy = Math.max(0, workspace.estimatedProgress - workspace.currentProgress);
        const dueDate = parseWorkspaceDate(workspace.dueDate);
        const workspaceDueSoon = Boolean(dueDate && dueDate.getTime() - Date.now() <= 14 * 24 * 60 * 60 * 1000);
        const reasons = [
          behindBy > 0 ? 'Behind plan' : null,
          overdueTasks > 0 ? `${overdueTasks} overdue` : null,
          dueSoonTasks > 0 ? `${dueSoonTasks} due soon` : null,
          workspaceDueSoon ? 'Workspace due soon' : null,
        ].filter((item): item is string => Boolean(item));
        return {
          ...workspace,
          overdueTasks,
          dueSoonTasks,
          behindBy,
          reasons,
          riskScore: behindBy * 2 + overdueTasks * 10 + dueSoonTasks * 4 + (workspaceDueSoon ? 3 : 0),
        };
      })
      .filter((workspace) => workspace.riskScore > 0)
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 4);

    const attentionTasks = [...state.tasks]
      .filter((task) => task.workflow !== 'done')
      .filter((task) => myTasksDateUtils.isBeforeToday(task.dueDate)
        || myTasksDateUtils.isDueSoon(task.dueDate)
        || myTasksDateUtils.isStale(task.updatedAt)
        || getPriorityWeight(task) >= 3)
      .sort(sortTasksForAttention)
      .slice(0, 6);

    const developerPriorityTasks = [...state.tasks]
      .filter((task) => task.workflow !== 'done')
      .sort(sortTasksForAttention)
      .slice(0, 8);

    const boardWorkload = Object.values(state.tasks.reduce<Record<string, {
      key: string;
      boardName: string;
      workspaceName: string;
      open: number;
      overdue: number;
      dueSoon: number;
    }>>((acc, task) => {
      const key = `${task.workspaceId}:${task.boardId}`;
      acc[key] ??= {
        key,
        boardName: task.boardName,
        workspaceName: task.workspaceName,
        open: 0,
        overdue: 0,
        dueSoon: 0,
      };
      if (task.workflow !== 'done') {
        acc[key].open += 1;
        if (myTasksDateUtils.isBeforeToday(task.dueDate)) acc[key].overdue += 1;
        if (myTasksDateUtils.isDueSoon(task.dueDate)) acc[key].dueSoon += 1;
      }
      return acc;
    }, {})).sort((left, right) => {
      if (left.overdue !== right.overdue) return right.overdue - left.overdue;
      if (left.open !== right.open) return right.open - left.open;
      return left.boardName.localeCompare(right.boardName);
    });

    const recentTasks = [...state.tasks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const healthTone: 'success' | 'warning' | 'danger' = state.taskSummary.overdue > 0 || riskProjects.length >= 3
      ? 'danger'
      : riskProjects.length > 0 || state.taskSummary.dueSoon > 0
        ? 'warning'
        : 'success';
    const healthLabel = healthTone === 'danger' ? 'At risk' : healthTone === 'warning' ? 'Watch' : 'Healthy';
    const healthCopy = healthTone === 'danger'
      ? 'Several signals need follow-up before new work gets added.'
      : healthTone === 'warning'
        ? 'The portfolio is moving, with a few areas to keep close.'
        : 'No urgent delivery risks are visible right now.';

    return {
      activeWorkspaces,
      completedWorkspaces,
      riskProjects,
      attentionTasks,
      developerPriorityTasks,
      boardWorkload,
      recentTasks,
      healthTone,
      healthLabel,
      healthCopy,
    };
  }, [state]);

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
  const showTeamLeadDashboard = hasRoleAtLeast('TEAM_LEAD');
  const openTaskInMyTasks = (taskId: string) => {
    navigate(`${ROUTES.issues}?task=${encodeURIComponent(taskId)}`);
  };

  if (!showTeamLeadDashboard) {
    return (
      <Box sx={{ flex: 1, px: { xs: 2, sm: 4 }, py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <DeveloperDashboard
          state={state}
          userName={userName}
          priorityTasks={derived.developerPriorityTasks}
          recentTasks={derived.recentTasks}
          onOpenTask={openTaskInMyTasks}
          onOpenAllTasks={() => navigate(ROUTES.issues)}
        />

        <MyTaskBoardDetailPanel
          task={selectedTask}
          onClose={() => {
            setSelectedTaskId(null);
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, px: { xs: 2, sm: 4 }, py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" data-page-title="true">
            Dashboard
          </Typography>
          <Typography sx={{ mt: 0.45, color: 'text.secondary', fontSize: 14.5, lineHeight: 1.55 }}>
            Welcome back, {userName}. A quick read on portfolio health, risk, and today's operational follow-up.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EmojiEventsOutlinedIcon />}
          onClick={(event) => setStatsAnchorEl(event.currentTarget)}
          sx={{
            borderRadius: '5px',
            textTransform: 'none',
            fontWeight: 900,
            borderWidth: 2,
            borderColor: (theme) => dashboardBorder(theme),
            color: 'text.primary',
            '&:hover': {
              borderWidth: 2,
              borderColor: (theme) => dashboardIconColor(theme),
            },
            '& .MuiButton-startIcon': {
              color: (theme) => dashboardIconColor(theme),
            },
          }}
        >
          Open stats
        </Button>
      </Box>

      <PersonalStatsPopover
        anchorEl={statsAnchorEl}
        career={state.career}
        rewards={state.rewards}
        onClose={() => setStatsAnchorEl(null)}
      />

      <Box sx={{ mt: 2.5 }}>
        <PortfolioHealthPanel
          activeCount={derived.activeWorkspaces.length}
          riskCount={derived.riskProjects.length}
          overdueCount={state.taskSummary.overdue}
          openCount={state.taskSummary.open}
          completedCount={state.taskSummary.completed}
          healthLabel={derived.healthLabel}
          healthTone={derived.healthTone}
          healthCopy={derived.healthCopy}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.35fr) minmax(340px, 0.85fr)' },
          gap: 2,
        }}
      >
        <AttentionList
          tasks={derived.attentionTasks}
          onOpenTask={setSelectedTaskId}
          onOpenAll={() => navigate(ROUTES.issues)}
        />
        <RiskProjects
          projects={derived.riskProjects}
          onOpenWorkspace={(workspaceId) => navigate(`/workspaces/${workspaceId}`)}
          onOpenAll={() => navigate(ROUTES.workspaces)}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(340px, 0.85fr)' },
          gap: 2,
        }}
      >
        <WorkloadSnapshot
          boardWorkload={derived.boardWorkload}
          summary={state.taskSummary}
        />
        <RecentMovement tasks={derived.recentTasks} onOpenTask={setSelectedTaskId} />
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
