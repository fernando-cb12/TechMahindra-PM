import { useEffect, useRef } from 'react';
import { LinearProgress } from '@mui/material';
import type { MyTaskListItem } from '../../services/myTasksService';
import { TaskBoardProvider } from '../workspaces/taskboard/TaskBoardContext';
import TaskDetailPanel from '../workspaces/taskboard/panel/TaskDetailPanel';
import { useTaskBoard } from '../workspaces/taskboard/useTaskBoard';

function MyTaskBoardDetailPanelContent({
  task,
  onClose,
}: {
  task: MyTaskListItem;
  onClose: () => void;
}) {
  const { isLoading, tasks, panel, openPanel } = useTaskBoard();
  const hasOpenedRef = useRef(false);
  const hasBeenOpenRef = useRef(false);

  useEffect(() => {
    hasOpenedRef.current = false;
    hasBeenOpenRef.current = false;
  }, [task.id]);

  useEffect(() => {
    if (isLoading || hasOpenedRef.current || !tasks[task.id]) return;
    openPanel(task.id);
    hasOpenedRef.current = true;
  }, [isLoading, openPanel, task.id, tasks]);

  useEffect(() => {
    if (panel.isOpen) {
      hasBeenOpenRef.current = true;
      return;
    }
    if (hasBeenOpenRef.current) {
      onClose();
    }
  }, [onClose, panel.isOpen]);

  return (
    <>
      {isLoading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1400 }} />}
      <TaskDetailPanel workspaceId={task.workspaceId} boardId={task.boardId} />
    </>
  );
}

export default function MyTaskBoardDetailPanel({
  task,
  onClose,
}: {
  task: MyTaskListItem | null;
  onClose: () => void;
}) {
  if (!task) return null;

  return (
    <TaskBoardProvider key={`${task.workspaceId}:${task.boardId}`} workspaceId={task.workspaceId} boardId={task.boardId}>
      <MyTaskBoardDetailPanelContent task={task} onClose={onClose} />
    </TaskBoardProvider>
  );
}
