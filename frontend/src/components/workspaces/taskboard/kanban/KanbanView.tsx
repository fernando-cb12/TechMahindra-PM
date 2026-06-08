import { useEffect, useMemo, useState, type MouseEvent, type SyntheticEvent } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Checkbox,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { alpha } from '@mui/material/styles';
import TaskFilterBar from '../TaskFilterBar';
import TaskCreateContextMenu from '../TaskCreateContextMenu';
import TaskActionContextMenu from '../TaskActionContextMenu';
import { useTaskBoard } from '../useTaskBoard';
import type { SelectOption, Task, TaskGroup } from '../types';
import { readStoredTaskFilters, taskMatchesFilters, type TaskFilterState } from '../taskFilters';
import { resolveTaskWorkflow, WORKFLOW_MEANING_LABELS } from '../workflow';

const WORKFLOW_COLORS = {
  new: '#D92D20',
  in_progress: '#B54708',
  done: '#067647',
  unclassified: '#667085',
};

function formatDueDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(task: Task, isDone: boolean) {
  if (!task.dueDate || isDone) return false;
  const today = new Date();
  const dueDate = new Date(`${task.dueDate}T23:59:59`);
  return dueDate < today;
}

function stopCardInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

interface EditableOptionChipProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  fallbackColor?: string;
}

function EditableOptionChip({ label, options, value, onChange, fallbackColor = '#667085' }: EditableOptionChipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const activeOption = options.find((option) => option.id === value);
  const chipColor = activeOption?.color || fallbackColor;

  return (
    <>
      <Chip
        size="small"
        label={activeOption?.label || label}
        onPointerDown={stopCardInteraction}
        onClick={(event) => {
          stopCardInteraction(event);
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          height: 22,
          fontSize: 10.5,
          fontWeight: 700,
          bgcolor: alpha(chipColor, 0.12),
          color: chipColor,
          cursor: 'pointer',
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 0.75, width: 210, borderRadius: 2 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.id}
            selected={option.id === value}
            onClick={() => {
              onChange(option.id);
              setAnchorEl(null);
            }}
            sx={{ borderRadius: 1.25, mb: 0.25, fontSize: 12.5 }}
          >
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: option.color, mr: 1 }} />
            {option.label}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}

interface EditableDateChipProps {
  value: string | null;
  overdue: boolean;
  onChange: (value: string | null) => void;
}

function EditableDateChip({ value, overdue, onChange }: EditableDateChipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const label = formatDueDate(value) || 'No date';

  return (
    <>
      <Chip
        size="small"
        label={label}
        onPointerDown={stopCardInteraction}
        onClick={(event) => {
          stopCardInteraction(event);
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          height: 22,
          fontSize: 10.5,
          fontWeight: 700,
          bgcolor: overdue ? alpha('#D92D20', 0.1) : 'action.hover',
          color: overdue ? '#D92D20' : value ? 'text.secondary' : 'text.disabled',
          cursor: 'pointer',
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 1.25, width: 190, borderRadius: 2 } } }}
      >
        <TextField
          type="date"
          size="small"
          value={value || ''}
          onChange={(event) => {
            onChange(event.target.value || null);
            setAnchorEl(null);
          }}
          fullWidth
          autoFocus
          inputProps={{ 'aria-label': 'Task due date' }}
          sx={{ '& .MuiInputBase-root': { height: 34, borderRadius: 1.5, fontSize: 12.5 } }}
        />
        {value && (
          <MenuItem
            onClick={() => {
              onChange(null);
              setAnchorEl(null);
            }}
            sx={{ mt: 0.75, borderRadius: 1.25, fontSize: 12.5 }}
          >
            Clear date
          </MenuItem>
        )}
      </Popover>
    </>
  );
}

interface EditableAssigneesProps {
  task: Task;
}

function EditableAssignees({ task }: EditableAssigneesProps) {
  const { users, updateTask } = useTaskBoard();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const assigneeIds = task.assigneeIds.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : [];
  const userList = Object.values(users);

  const toggleAssignee = (userId: string) => {
    const nextIds = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    updateTask(task.id, { assigneeIds: nextIds, assigneeId: nextIds[0] ?? null });
  };

  return (
    <>
      <Box
        onPointerDown={stopCardInteraction}
        onClick={(event) => {
          stopCardInteraction(event);
          setAnchorEl(event.currentTarget);
        }}
        sx={{ cursor: 'pointer', minHeight: 24, display: 'flex', alignItems: 'center' }}
      >
        {assigneeIds.length > 0 ? (
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10, borderWidth: 1 } }}>
            {assigneeIds.map((id) => (
              <Avatar key={id} src={users[id]?.avatarUrl || undefined}>
                {users[id]?.initials || '?'}
              </Avatar>
            ))}
          </AvatarGroup>
        ) : (
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 700 }}>
            Unassigned
          </Typography>
        )}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 0.75, width: 230, maxHeight: 280, borderRadius: 2, overflowY: 'auto' } } }}
      >
        {userList.map((user) => (
          <MenuItem
            key={user.id}
            onClick={() => toggleAssignee(user.id)}
            sx={{ borderRadius: 1.25, mb: 0.25, fontSize: 12.5 }}
          >
            <Checkbox checked={assigneeIds.includes(user.id)} size="small" sx={{ p: 0.25, mr: 0.75 }} />
            <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 22, height: 22, fontSize: 10, mr: 1 }}>
              {user.initials}
            </Avatar>
            {user.name}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}

interface EditableProgressProps {
  value: number;
  done: boolean;
  onChange: (value: number) => void;
}

function EditableProgress({ value, done, onChange }: EditableProgressProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const progressValue = Math.max(0, Math.min(100, value || 0));
  const options = [0, 25, 50, 75, 100];

  return (
    <>
      <Box
        onPointerDown={stopCardInteraction}
        onClick={(event) => {
          stopCardInteraction(event);
          setAnchorEl(event.currentTarget);
        }}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
      >
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: done ? '#067647' : '#5F0229', borderRadius: 999 },
          }}
        />
        <Typography sx={{ width: 34, textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'text.secondary' }}>
          {progressValue}%
        </Typography>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 0.75, width: 130, borderRadius: 2 } } }}
        onClick={stopCardInteraction}
        onPointerDown={stopCardInteraction}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            selected={option === progressValue}
            onPointerDown={stopCardInteraction}
            onClick={(event) => {
              stopCardInteraction(event);
              onChange(option);
              setAnchorEl(null);
            }}
            sx={{ borderRadius: 1.25, mb: 0.25, fontSize: 12.5, fontWeight: 700 }}
          >
            {option}%
          </MenuItem>
        ))}
      </Popover>
    </>
  );
}

interface KanbanCardProps {
  task: Task;
  isOverlay?: boolean;
  onTaskMenu?: (event: MouseEvent, taskId: string) => void;
}

function KanbanCard({ task, isOverlay = false, onTaskMenu }: KanbanCardProps) {
  const { boardConfig, openPanel, updateTask } = useTaskBoard();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: isOverlay,
  });

  const statusOption = boardConfig.statusOptions.find((option) => option.id === task.status);
  const priorityOption = boardConfig.priorityOptions.find((option) => option.id === task.priority);
  const workflowState = resolveTaskWorkflow(task, boardConfig);
  const displayWorkflowState = workflowState === 'none' ? 'unclassified' : workflowState;
  const workflowColor = WORKFLOW_COLORS[displayWorkflowState];
  const done = displayWorkflowState === 'done';
  const overdue = isOverdue(task, done);
  const dueLabel = formatDueDate(task.dueDate);

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      onClick={() => !isOverlay && openPanel(task.id)}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isOverlay) onTaskMenu?.(event, task.id);
      }}
      {...attributes}
      {...listeners}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: overdue ? alpha('#D92D20', 0.45) : 'divider',
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        cursor: isOverlay ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        boxShadow: isOverlay ? 6 : '0 1px 2px rgba(16, 24, 40, 0.06)',
        '&:hover': {
          borderColor: alpha('#5F0229', 0.35),
          boxShadow: '0 6px 18px rgba(16, 24, 40, 0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
          {task.name}
        </Typography>
        <Chip
          size="small"
          label={displayWorkflowState === 'unclassified' ? 'Open' : WORKFLOW_MEANING_LABELS[displayWorkflowState]}
          sx={{
            height: 22,
            fontSize: 10.5,
            fontWeight: 800,
            bgcolor: alpha(workflowColor, 0.1),
            color: workflowColor,
            flexShrink: 0,
            '& .MuiChip-label': { px: 0.8 },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.25 }}>
        {statusOption && !isOverlay && (
          <EditableOptionChip
            label="Status"
            options={boardConfig.statusOptions}
            value={task.status}
            onChange={(status) => updateTask(task.id, { status })}
          />
        )}
        {priorityOption && !isOverlay && (
          <EditableOptionChip
            label="Priority"
            options={boardConfig.priorityOptions}
            value={task.priority}
            onChange={(priority) => updateTask(task.id, { priority })}
          />
        )}
        <Tooltip title="Base task points awarded when this task is completed" arrow>
          <Chip
            size="small"
            icon={<BoltIcon />}
            label={`${task.pointsValue ?? 25} pts`}
            sx={{
              height: 22,
              fontSize: 10.5,
              fontWeight: 800,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
              '& .MuiChip-icon': { fontSize: 13, color: 'primary.main' },
            }}
          />
        </Tooltip>
        {!isOverlay && (
          <EditableDateChip
            value={task.dueDate}
            overdue={overdue}
            onChange={(dueDate) => updateTask(task.id, { dueDate })}
          />
        )}
        {isOverlay && statusOption && (
          <Chip size="small" label={statusOption.label} sx={{ height: 22, fontSize: 10.5, fontWeight: 700, bgcolor: alpha(statusOption.color, 0.12), color: statusOption.color }} />
        )}
        {isOverlay && priorityOption && (
          <Chip size="small" label={priorityOption.label} sx={{ height: 22, fontSize: 10.5, fontWeight: 700, bgcolor: alpha(priorityOption.color, 0.12), color: priorityOption.color }} />
        )}
        {isOverlay && dueLabel && (
          <Chip size="small" label={dueLabel} sx={{ height: 22, fontSize: 10.5, fontWeight: 700, bgcolor: overdue ? alpha('#D92D20', 0.1) : 'action.hover', color: overdue ? '#D92D20' : 'text.secondary' }} />
        )}
      </Box>

      {!isOverlay ? (
        <EditableProgress
          value={task.progress}
          done={done}
          onChange={(progress) => updateTask(task.id, { progress })}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, task.progress || 0))}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: done ? '#067647' : '#5F0229', borderRadius: 999 },
            }}
          />
          <Typography sx={{ width: 34, textAlign: 'right', fontSize: 11, fontWeight: 800, color: 'text.secondary' }}>
            {task.progress || 0}%
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>
          {task.updates.length} updates
        </Typography>
        {!isOverlay && <EditableAssignees task={task} />}
      </Box>
    </Paper>
  );
}

interface KanbanColumnProps {
  group: TaskGroup;
  tasks: Task[];
  onCreateMenu: (event: MouseEvent, groupId: string) => void;
  onTaskMenu: (event: MouseEvent, taskId: string) => void;
}

function KanbanColumn({ group, tasks, onCreateMenu, onTaskMenu }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { type: 'Group', group },
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      onContextMenu={(event) => onCreateMenu(event, group.id)}
      sx={{
        width: 316,
        minWidth: 316,
        maxHeight: 'calc(100vh - 260px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOver ? alpha(group.color, 0.65) : 'divider',
        bgcolor: isOver ? alpha(group.color, 0.06) : alpha(group.color, 0.035),
      }}
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.name}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={tasks.length}
            sx={{ height: 22, minWidth: 28, fontSize: 11, fontWeight: 800, bgcolor: alpha(group.color, 0.12), color: group.color }}
          />
        </Box>
      </Box>

      <Box sx={{ p: 1.25, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 180 }}>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskMenu={onTaskMenu} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <Box
            sx={{
              minHeight: 112,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: alpha(group.color, 0.35),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 700 }}>
              Drop tasks here
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default function KanbanView() {
  const { tasks, groups, boardConfig, moveTask } = useTaskBoard();
  const filterStorageKey = `taskboard:${boardConfig.workspaceId}:kanbanFilters`;
  const [filters, setFilters] = useState<TaskFilterState>(() => readStoredTaskFilters(filterStorageKey));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createMenu, setCreateMenu] = useState<{ mouseX: number; mouseY: number; groupId: string } | null>(null);
  const [taskMenu, setTaskMenu] = useState<{ mouseX: number; mouseY: number; taskId: string } | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem(filterStorageKey, JSON.stringify(filters));
  }, [filterStorageKey, filters]);

  const taskList = useMemo(() => Object.values(tasks), [tasks]);
  const visibleTasks = useMemo(
    () => taskList.filter((task) => taskMatchesFilters(task, filters, boardConfig)),
    [taskList, filters, boardConfig]
  );
  const visibleTaskIds = useMemo(() => new Set(visibleTasks.map((task) => task.id)), [visibleTasks]);
  const displayedGroups = useMemo(
    () => filters.groupIds.length > 0 ? groups.filter((group) => filters.groupIds.includes(group.id)) : groups,
    [filters.groupIds, groups]
  );
  const visibleGroups = useMemo(
    () => displayedGroups.map((group) => ({
      ...group,
      tasks: group.taskIds
        .filter((taskId) => visibleTaskIds.has(taskId))
        .map((taskId) => tasks[taskId])
        .filter((task): task is Task => Boolean(task)),
    })),
    [displayedGroups, tasks, visibleTaskIds]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findGroupByTaskId = (taskId: string) => groups.find((group) => group.taskIds.includes(taskId));

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (activeData?.type === 'Task') {
      setActiveTask(activeData.task as Task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (activeData?.type !== 'Task') return;

    const activeTaskItem = activeData.task as Task;
    const fromGroup = findGroupByTaskId(activeTaskItem.id);
    if (!fromGroup) return;

    if (overData?.type === 'Task') {
      const overTaskItem = overData.task as Task;
      const toGroup = findGroupByTaskId(overTaskItem.id);
      if (!toGroup) return;

      const newIndex = Math.max(0, toGroup.taskIds.indexOf(overTaskItem.id));
      moveTask(activeTaskItem.id, fromGroup.id, toGroup.id, newIndex);
      return;
    }

    if (overData?.type === 'Group') {
      const toGroup = overData.group as TaskGroup;
      const originalToGroup = groups.find((group) => group.id === toGroup.id);
      if (!originalToGroup || fromGroup.id === originalToGroup.id) return;
      moveTask(activeTaskItem.id, fromGroup.id, originalToGroup.id, originalToGroup.taskIds.length);
    }
  };

  const openCreateMenu = (event: MouseEvent, groupId: string) => {
    event.preventDefault();
    setCreateMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, groupId });
  };

  const openTaskMenu = (event: MouseEvent, taskId: string) => {
    event.preventDefault();
    setTaskMenu({ mouseX: event.clientX + 2, mouseY: event.clientY - 6, taskId });
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Kanban
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25 }}>
          {visibleTasks.length} tasks across {visibleGroups.length} groups
        </Typography>
      </Box>

      <TaskFilterBar
        filters={filters}
        setFilters={setFilters}
        resultLabel={`${visibleTasks.length} visible`}
        storageKey={filterStorageKey}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, flex: 1 }}>
          {visibleGroups.map((group) => (
            <KanbanColumn
              key={group.id}
              group={group}
              tasks={group.tasks}
              onCreateMenu={openCreateMenu}
              onTaskMenu={openTaskMenu}
            />
          ))}
        </Box>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskCreateContextMenu
        position={createMenu}
        groupId={createMenu?.groupId}
        onClose={() => setCreateMenu(null)}
      />
      <TaskActionContextMenu
        taskId={taskMenu?.taskId ?? null}
        position={taskMenu}
        onClose={() => setTaskMenu(null)}
      />
    </Box>
  );
}
