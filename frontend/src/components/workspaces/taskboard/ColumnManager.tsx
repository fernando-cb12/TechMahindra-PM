// ─── ColumnManager — manages visibility and order of columns ───

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Checkbox, Divider, Chip } from '@mui/material';
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
import { getMetricCatalog, type MetricSemanticField } from '../../../services/metricsService';

const SEMANTIC_LABELS: Record<MetricSemanticField['semanticKey'], string> = {
  budget: 'Budget',
  progress: 'Progress',
  due_date: 'Due Date',
  priority: 'Priority',
  effort: 'Effort',
};

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
  const { boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const { boardConfig, updateColumns } = useTaskBoard();
  const [semanticFields, setSemanticFields] = useState<MetricSemanticField[]>([]);
  
  // Sort columns by their current order
  const sortedColumns = useMemo(() => {
    return [...boardConfig.columns].sort((a, b) => a.order - b.order);
  }, [boardConfig.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!boardId) return undefined;
    let cancelled = false;
    getMetricCatalog({ boardIds: [boardId] })
      .then((catalog) => {
        if (!cancelled) {
          setSemanticFields(catalog.semanticFields.filter((field) => field.boardId === boardId));
        }
      })
      .catch(() => {
        if (!cancelled) setSemanticFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    const handleMappingUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ boardId?: string }>).detail;
      if (!detail?.boardId || detail.boardId === boardId) {
        void getMetricCatalog({ boardIds: boardId ? [boardId] : [] })
          .then((catalog) => {
            setSemanticFields(boardId ? catalog.semanticFields.filter((field) => field.boardId === boardId) : []);
          })
          .catch(() => setSemanticFields([]));
      }
    };
    window.addEventListener('metric-field-mapping-updated', handleMappingUpdated);
    return () => {
      window.removeEventListener('metric-field-mapping-updated', handleMappingUpdated);
    };
  }, [boardId]);

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

      <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', mb: 1 }}>
        Current Metrics Maps
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
        {(Object.keys(SEMANTIC_LABELS) as MetricSemanticField['semanticKey'][]).map((semanticKey) => {
          const field = semanticFields.find((item) => item.semanticKey === semanticKey);
          return (
            <Box
              key={semanticKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {SEMANTIC_LABELS[semanticKey]}
              </Typography>
              <Chip
                size="small"
                color={field?.missing ? 'warning' : 'default'}
                label={field?.sourceLabel ?? 'Not mapped'}
                sx={{ maxWidth: 160, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
              />
            </Box>
          );
        })}
      </Box>
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
