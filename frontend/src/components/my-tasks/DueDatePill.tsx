import type { MyTaskListItem } from '../../services/myTasksService';
import { myTasksDateUtils } from '../../services/myTasksService';
import TaskPill from './TaskPill';
import { formatDueDate } from './myTasksUtils';

export default function DueDatePill({ task }: { task: MyTaskListItem }) {
  const done = task.workflow === 'done';
  const overdue = !done && myTasksDateUtils.isBeforeToday(task.dueDate);
  const dueSoon = !done && myTasksDateUtils.isDueSoon(task.dueDate);
  const color = overdue ? '#D92D20' : dueSoon ? '#B54708' : task.dueDate ? '#475467' : '#98A2B3';
  const label = overdue ? `${formatDueDate(task.dueDate)} overdue` : dueSoon ? `${formatDueDate(task.dueDate)} soon` : formatDueDate(task.dueDate);
  return <TaskPill label={label} color={color} />;
}
