// ─── TaskRow — renders a single task row with dynamically mapped cells ───

import { useMemo } from 'react';
import { Box, Checkbox, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, ColumnDefinition } from '../types';
import TaskCell from './TaskCell';
import { useTaskBoard } from '../TaskBoardContext';

interface TaskRowProps {
  task: Task;
  columns: ColumnDefinition[];
  groupColor: string;
}

export default function TaskRow({ task, columns, groupColor }: TaskRowProps) {
  const { toggleTaskComplete, completedTasks, openPanel, panel } = useTaskBoard();
  const isComplete = completedTasks.has(task.id);
  const isSelected = panel.taskId === task.id;

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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Re-map column types to task fields
  const cellValues = useMemo(() => {
    return columns.map((col) => {
      let value: string | number | null = null;
      switch (col.type) {
        case 'text': value = task.name; break;
        case 'assignee': value = task.assigneeId; break;
        case 'status': value = task.status; break;
        case 'priority': value = task.priority; break;
        case 'date': value = task.dueDate; break;
        case 'progress': value = task.progress; break;
        case 'budget': value = task.budget; break;
        case 'files': value = null; break; // Placeholder
      }
      return { col, value };
    });
  }, [task, columns]);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: isSelected ? (t) => alpha(t.palette.primary.main, 0.08) : 'background.paper',
        '&:hover': {
          bgcolor: isSelected
            ? (t) => alpha(t.palette.primary.main, 0.12)
            : (t) => alpha(t.palette.action.hover, 0.04),
        },
        position: 'relative',
        minHeight: 40,
      }}
    >
      {/* Selection border indicator */}
      <Box
        sx={{
          width: 4,
          bgcolor: groupColor,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />

      {/* Checkbox and Drag Handle Area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: 50,
          px: 1,
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(groupColor, 0.1),
        }}
      >
        <Box
          {...attributes}
          {...listeners}
          sx={{
            width: 12,
            height: 20,
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            mr: 0.5,
            '.MuiBox-root:hover > &': { opacity: 0.5 },
            '&:hover': { opacity: 1 },
          }}
        >
          <Box sx={{ width: 4, height: 12, borderLeft: '2px dotted', borderRight: '2px dotted', borderColor: 'text.secondary' }} />
        </Box>
        <Checkbox
          size="small"
          checked={isComplete}
          onChange={() => toggleTaskComplete(task.id)}
          sx={{ p: 0.5, color: groupColor, '&.Mui-checked': { color: groupColor } }}
        />
      </Box>

      {/* Dynamic Cells */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          opacity: isComplete ? 0.6 : 1,
        }}
      >
        {cellValues.map(({ col, value }, index) => {
          const isFirst = index === 0;
          return (
            <Box
              key={col.id}
              onClick={(e) => {
                // If clicking the name column (or any area not directly an input), open panel
                if (isFirst && (e.target as HTMLElement).tagName !== 'INPUT') {
                  openPanel(task.id);
                }
              }}
              sx={{
                flex: col.width ? `0 0 ${col.width}px` : 1,
                minWidth: col.width || 120,
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                cursor: isFirst ? 'pointer' : 'default',
                textDecoration: isFirst && isComplete ? 'line-through' : 'none',
                position: 'relative',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TaskCell taskId={task.id} columnType={col.type} value={value} />
              </Box>
              
              {/* Updates indicator on the first column */}
              {isFirst && task.updates.length > 0 && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPanel(task.id);
                  }}
                  sx={{ p: 0.5, ml: 1, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
