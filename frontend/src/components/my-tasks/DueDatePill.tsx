import type { MyTaskListItem } from '../../services/myTasksService';
import { useTheme } from '@mui/material/styles';
import { myTasksDateUtils } from '../../services/myTasksService';
import TaskPill from './TaskPill';
import { formatDueDate } from './myTasksUtils';

export default function DueDatePill({ task }: { task: MyTaskListItem }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const done = task.workflow === 'done';
  const overdue = !done && myTasksDateUtils.isBeforeToday(task.dueDate);
  const dueSoon = !done && myTasksDateUtils.isDueSoon(task.dueDate);
  const color = overdue
    ? (isDark ? '#FF8A80' : '#D92D20')
    : dueSoon
      ? (isDark ? '#FCD34D' : '#B54708')
      : task.dueDate
        ? (isDark ? '#D0D5DD' : '#475467')
        : (isDark ? '#98A2B3' : '#98A2B3');
  const label = overdue ? `${formatDueDate(task.dueDate)} overdue` : dueSoon ? `${formatDueDate(task.dueDate)} soon` : formatDueDate(task.dueDate);
  return <TaskPill label={label} color={color} />;
}
