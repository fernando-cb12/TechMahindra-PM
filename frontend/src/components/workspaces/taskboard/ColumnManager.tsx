// ─── ColumnManager — manages visibility and order of columns ───

import { useMemo } from 'react';
import { Box, Typography, Checkbox, Divider } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskBoard } from './useTaskBoard';
import type { ColumnDefinition } from './types';

// Sortable item wrapper
function SortableColumnItem({ column, onToggle }: { column: ColumnDefinition; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
        px: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 0.5,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', mr: 1, color: 'text.secondary' }}>
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <Checkbox
        size="small"
        checked={column.isVisible}
        onChange={onToggle}
        disabled={column.type === 'text'} // Cannot hide task name
        sx={{ p: 0.5 }}
      />
      <Typography sx={{ fontSize: 13, flex: 1 }}>{column.label}</Typography>
    </Box>
  );
}

export default function ColumnManager() {
  const { boardConfig, updateColumns } = useTaskBoard();
  
  // Sort columns by their current order
  const sortedColumns = useMemo(() => {
    return [...boardConfig.columns].sort((a, b) => a.order - b.order);
  }, [boardConfig.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedColumns.findIndex((c) => c.id === active.id);
      const newIndex = sortedColumns.findIndex((c) => c.id === over.id);
      
      const newArray = arrayMove(sortedColumns, oldIndex, newIndex);
      // Reassign order
      const updated = newArray.map((col, i) => ({ ...col, order: i }));
      updateColumns(updated);
    }
  };

  const handleToggle = (colId: string) => {
    const updated = sortedColumns.map((col) =>
      col.id === colId ? { ...col, isVisible: !col.isVisible } : col
    );
    updateColumns(updated);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
        Manage Columns
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
        Drag to reorder. Check to show/hide.
      </Typography>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedColumns} strategy={verticalListSortingStrategy}>
          {sortedColumns.map((col) => (
            <SortableColumnItem
              key={col.id}
              column={col}
              onToggle={() => handleToggle(col.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
}
