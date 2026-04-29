// ─── TaskGroup — renders a collapsible group of tasks ───

import { useState } from 'react';
import { Box, Typography, IconButton, Button, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TaskGroup as TaskGroupType } from '../types';
import { useTaskBoard } from '../TaskBoardContext';
import TaskRow from './TaskRow';
import ColumnHeader from './ColumnHeader';

interface TaskGroupProps {
  group: TaskGroupType;
}

export default function TaskGroup({ group }: TaskGroupProps) {
  const {
    tasks,
    boardConfig,
    collapsedGroups,
    toggleGroupCollapse,
    addTask,
  } = useTaskBoard();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const isCollapsed = collapsedGroups.has(group.id);
  const groupTasks = group.taskIds.map((id) => tasks[id]).filter(Boolean);
  
  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);

  const handleAddTask = () => {
    if (!newTaskName.trim()) {
      setIsAdding(false);
      return;
    }

    const newTask = {
      id: `new_${Date.now()}`,
      name: newTaskName,
      groupId: group.id,
      workspaceId: group.workspaceId,
      assigneeId: null,
      status: boardConfig.statusOptions[0]?.id || '',
      priority: boardConfig.priorityOptions[0]?.id || '',
      dueDate: null,
      progress: 0,
      budget: null,
      files: [],
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTask(newTask);
    setNewTaskName('');
    setIsAdding(false);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Group Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          px: 1,
        }}
      >
        <IconButton
          size="small"
          onClick={() => toggleGroupCollapse(group.id)}
          sx={{ color: group.color }}
        >
          {isCollapsed ? <KeyboardArrowRightIcon /> : <ExpandMoreIcon />}
        </IconButton>
        
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: group.color,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {group.name}
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: 'text.secondary',
              bgcolor: 'background.paper',
              px: 1,
              py: 0.25,
              borderRadius: 4,
            }}
          >
            {groupTasks.length} Tasks
          </Typography>
        </Typography>
      </Box>

      {/* Group Content */}
      <Collapse in={!isCollapsed}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <ColumnHeader groupColor={group.color} />
          
          <SortableContext items={group.taskIds} strategy={verticalListSortingStrategy}>
            {groupTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                columns={visibleColumns}
                groupColor={group.color}
              />
            ))}
          </SortableContext>

          {/* Add Task Inline Row */}
          {isAdding ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                minHeight: 40,
              }}
            >
              <Box sx={{ width: 4 }} />
              <Box sx={{ width: 50, borderRight: '1px solid', borderColor: 'divider' }} />
              <Box sx={{ flex: 1, px: 2, display: 'flex', alignItems: 'center' }}>
                <input
                  autoFocus
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewTaskName('');
                    }
                  }}
                  onBlur={() => {
                     // small timeout to allow click to register if they clicked add
                     setTimeout(handleAddTask, 100);
                  }}
                  placeholder="Task name"
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: 'inherit',
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 40,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
               <Box sx={{ width: 4 }} />
               <Box sx={{ width: 50, borderRight: '1px solid', borderColor: 'divider' }} />
               <Button
                startIcon={<AddIcon />}
                onClick={() => setIsAdding(true)}
                sx={{
                  ml: 1,
                  color: 'text.secondary',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  fontWeight: 500,
                  '&:hover': { bgcolor: 'transparent', color: group.color }
                }}
              >
                Add Task
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
