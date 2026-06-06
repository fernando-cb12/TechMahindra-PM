// ─── MainTableView — coordinates task and group Drag & Drop (Section 3.4/10 of spec) ───

import { Box, Typography } from '@mui/material';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTaskBoard } from '../useTaskBoard';
import TaskGroup from './TaskGroup';
import TableToolbar from './TableToolbar';
import { useState } from 'react';
import TaskRow from './TaskRow';
import type { Task, TaskGroup as TaskGroupType } from '../types';

export default function MainTableView() {
  const { visibleGroups, boardConfig, moveTask, reorderGroups, sortMode, setSortMode } = useTaskBoard();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeGroup, setActiveGroup] = useState<TaskGroupType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);
  const tableWidth = 4 + 50 + visibleColumns.reduce((total, column) => total + (column.width || 120), 0) + 40;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'Task') {
      setActiveTask(activeData.task as Task);
    } else if (activeData?.type === 'Group') {
      // Clear sorting if a drag is started
      if (sortMode !== 'none') {
        setSortMode('none');
      }
      setActiveGroup(activeData.group as TaskGroupType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    setActiveGroup(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'Task' && overData?.type === 'Task') {
      const activeTaskItem = activeData.task as Task;
      const overTaskItem = overData.task as Task;

      const fromGroup = visibleGroups.find((g) => g.taskIds.includes(activeTaskItem.id));
      const toGroup = visibleGroups.find((g) => g.taskIds.includes(overTaskItem.id));

      if (fromGroup && toGroup) {
        const newIndex = toGroup.taskIds.indexOf(overTaskItem.id);
        moveTask(activeTaskItem.id, fromGroup.id, toGroup.id, newIndex);
      }
    } else if (activeData?.type === 'Task' && overData?.type === 'Group') {
      const activeTaskItem = activeData.task as Task;
      const overGroupItem = overData.group as TaskGroupType;

      const fromGroup = visibleGroups.find((g) => g.taskIds.includes(activeTaskItem.id));
      if (fromGroup && fromGroup.id !== overGroupItem.id) {
        moveTask(activeTaskItem.id, fromGroup.id, overGroupItem.id, overGroupItem.taskIds.length);
      }
    } else if (activeData?.type === 'Group' && overData?.type === 'Group') {
      const activeGroupItem = activeData.group as TaskGroupType;
      const overGroupItem = overData.group as TaskGroupType;

      if (activeGroupItem.id !== overGroupItem.id) {
        const oldIndex = visibleGroups.findIndex((g) => g.id === activeGroupItem.id);
        const newIndex = visibleGroups.findIndex((g) => g.id === overGroupItem.id);
        
        const newArray = arrayMove(visibleGroups, oldIndex, newIndex);
        reorderGroups(newArray);
      }
    }
  };

  const groupIds = visibleGroups.map((g) => g.id);

  return (
    <Box sx={{ pb: 10 }}>
      <TableToolbar />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ mt: 2, overflowX: 'auto', overflowY: 'visible', pb: 2, minWidth: 0 }}>
          <Box sx={{ width: tableWidth, minWidth: '100%' }}>
            {/* Outer Sortable Context for Group Reordering */}
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
              {visibleGroups.map((group) => (
                <TaskGroup key={group.id} group={group} />
              ))}
            </SortableContext>
          </Box>
        </Box>

        <DragOverlay>
          {activeTask ? (
            <Box sx={{ opacity: 0.8, boxShadow: 3 }}>
              <TaskRow
                task={activeTask}
                columns={visibleColumns}
                groupColor="#5F0229" 
              />
            </Box>
          ) : activeGroup ? (
            <Box
              sx={{
                opacity: 0.8,
                boxShadow: 3,
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 2,
                border: '2px solid',
                borderColor: activeGroup.color,
                minWidth: 300,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: activeGroup.color, fontSize: 16 }}>
                {activeGroup.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                {activeGroup.taskIds.length} Tasks
              </Typography>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}
