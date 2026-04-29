// ─── MainTableView — top-level table view coordinating Drag & Drop ───

import { Box } from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useTaskBoard } from '../TaskBoardContext';
import TaskGroup from './TaskGroup';
import TableToolbar from './TableToolbar';
import { useState } from 'react';
import TaskRow from './TaskRow';
import type { Task } from '../types';

export default function MainTableView() {
  const { groups, boardConfig, moveTask } = useTaskBoard();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task as Task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return;

    // Both active and over should be Tasks since we are only sorting tasks within/across groups
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'Task' && overData?.type === 'Task') {
      const activeTask = activeData.task as Task;
      const overTask = overData.task as Task;

      const fromGroup = groups.find((g) => g.taskIds.includes(activeTask.id));
      const toGroup = groups.find((g) => g.taskIds.includes(overTask.id));

      if (fromGroup && toGroup) {
        const newIndex = toGroup.taskIds.indexOf(overTask.id);
        moveTask(activeTask.id, fromGroup.id, toGroup.id, newIndex);
      }
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <TableToolbar />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ mt: 2 }}>
          {groups.map((group) => (
            <TaskGroup key={group.id} group={group} />
          ))}
        </Box>

        <DragOverlay>
          {activeTask ? (
            <Box sx={{ opacity: 0.8, boxShadow: 3 }}>
              {/* Note: In a real implementation we would look up the group color, 
                  but for the overlay generic primary is fine. */}
              <TaskRow
                task={activeTask}
                columns={visibleColumns}
                groupColor="#5F0229" 
              />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}
