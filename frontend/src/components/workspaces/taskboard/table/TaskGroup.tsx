// ─── TaskGroup — collapsible sortable group of tasks with header customization (Section 3.4/9/4 of spec) ───

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Collapse,
  TextField,
  Popover,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskGroup as TaskGroupType } from '../types';
import { useTaskBoard } from '../useTaskBoard';
import TaskRow from './TaskRow';
import ColumnHeader from './ColumnHeader';

interface TaskGroupProps {
  group: TaskGroupType;
}

const PRESET_COLORS = [
  { name: 'Burgundy', value: '#A3334D' },
  { name: 'Yellow', value: '#EAC24F' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Gray', value: '#9E9E9E' },
  { name: 'Red', value: '#FB485B' },
];

export default function TaskGroup({ group }: TaskGroupProps) {
  const {
    tasks,
    boardConfig,
    availableBoards,
    collapsedGroups,
    toggleGroupCollapse,
    addTask,
    updateGroupColor,
    updateGroupName,
    moveGroupToBoard,
    deleteGroup,
  } = useTaskBoard();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  
  // Group name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [boardMenuAnchor, setBoardMenuAnchor] = useState<HTMLElement | null>(null);

  // Group color popover state
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  // Sortable setup for the group itself
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group.id,
    data: { type: 'Group', group },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isCollapsed = collapsedGroups.has(group.id);
  const groupTasks = group.taskIds.map((id) => tasks[id]).filter(Boolean);
  
  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);
  const columnsWidth = visibleColumns.reduce((total, column) => total + (column.width || 120), 0);

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
      assigneeIds: [],
      status: boardConfig.statusOptions[0]?.id || '',
      priority: boardConfig.priorityOptions.find((option) => option.id === 'medium')?.id || 'medium',
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

  const handleNameSave = () => {
    if (draftName.trim() && draftName !== group.name) {
      updateGroupName(group.id, draftName);
    }
    setIsEditingName(false);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setBoardMenuAnchor(null);
  };

  const requestGroupRename = () => {
    setDraftName(group.name);
    setIsEditingName(true);
    closeContextMenu();
  };

  const requestGroupDelete = () => {
    closeContextMenu();
    deleteGroup(group.id);
  };

  const targetBoards = availableBoards.filter((board) => board.id !== group.workspaceId);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ mb: 4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Group Header */}
      <Box
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ mouseX: e.clientX + 2, mouseY: e.clientY - 6 });
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1,
          px: 1,
        }}
      >
        {/* Group Drag Handle Icon */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            opacity: isHovered ? 0.6 : 0,
            transition: 'opacity 0.2s',
            mr: 0.5,
            '&:hover': { opacity: 1 },
          }}
          title="Drag to reorder groups"
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        <IconButton
          size="small"
          onClick={() => toggleGroupCollapse(group.id)}
          sx={{ color: group.color }}
        >
          {isCollapsed ? <KeyboardArrowRightIcon /> : <ExpandMoreIcon />}
        </IconButton>
        
        {/* Editable Group Title */}
        {isEditingName ? (
          <TextField
            size="small"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave();
              if (e.key === 'Escape') {
                setDraftName(group.name);
                setIsEditingName(false);
              }
            }}
            autoFocus
            sx={{
              '& input': {
                fontSize: 18,
                fontWeight: 600,
                color: group.color,
                py: 0.25,
                px: 1,
              },
              width: 'auto',
            }}
            variant="standard"
          />
        ) : (
          <Typography
            onClick={() => setIsEditingName(true)}
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: group.color,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'text',
              userSelect: 'none',
              px: 0.5,
              py: 0.25,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
            title="Click to edit group name"
          >
            {group.name}
          </Typography>
        )}

        {/* Hover Color Square Trigger (Section 9.1 of spec) */}
        <Button
          onClick={(e) => setColorAnchor(e.currentTarget)}
          sx={{
            minWidth: 0,
            width: 14,
            height: 14,
            p: 0,
            borderRadius: '4px',
            bgcolor: group.color,
            opacity: isHovered || Boolean(colorAnchor) ? 0.8 : 0,
            transition: 'opacity 0.2s',
            ml: 1.5,
            border: '1px solid rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: group.color, opacity: 1 },
          }}
          title="Change group color"
        />

        {/* Group Color Picker Popover (Section 9.2 of spec) */}
        <Popover
          open={Boolean(colorAnchor)}
          anchorEl={colorAnchor}
          onClose={() => setColorAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { p: 1.5, borderRadius: 2, width: 170, mt: 0.5 } } }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>
            Group Color
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {PRESET_COLORS.map((c) => {
              const isSelected = group.color === c.value;
              return (
                <IconButton
                  key={c.value}
                  size="small"
                  onClick={() => {
                    updateGroupColor(group.id, c.value);
                    setColorAnchor(null);
                    closeContextMenu();
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: c.value,
                    border: '1.5px solid',
                    borderColor: isSelected ? 'text.primary' : 'transparent',
                    '&:hover': { bgcolor: c.value, opacity: 0.9 },
                  }}
                  title={c.name}
                >
                  {isSelected && <CheckCircleIcon sx={{ fontSize: 12, color: 'white' }} />}
                </IconButton>
              );
            })}
          </Box>
        </Popover>

        {/* Task Counter badge */}
        <Typography
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            px: 1,
            py: 0.25,
            borderRadius: 4,
            ml: 1.5,
          }}
        >
          {groupTasks.length} Tasks
        </Typography>
      </Box>

      <Menu
        open={Boolean(contextMenu)}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, py: 0.5 } } }}
      >
        <MenuItem onClick={requestGroupRename}>
          <DriveFileRenameOutlineIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Rename group</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsAdding(true);
            closeContextMenu();
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Add item here</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            toggleGroupCollapse(group.id);
            closeContextMenu();
          }}
        >
          {isCollapsed ? (
            <ExpandMoreIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          ) : (
            <KeyboardArrowRightIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          )}
          <Typography sx={{ fontSize: 13 }}>{isCollapsed ? 'Expand group' : 'Collapse group'}</Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setColorAnchor(e.currentTarget);
          }}
        >
          <PaletteOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Change color</Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => setBoardMenuAnchor(e.currentTarget)}
          disabled={targetBoards.length === 0}
        >
          <DashboardCustomizeIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Move group to board</Typography>
          <KeyboardArrowRightIcon sx={{ fontSize: 16, ml: 'auto', color: 'text.secondary' }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={requestGroupDelete} sx={{ color: 'error.main' }}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1.25 }} />
          <Typography sx={{ fontSize: 13 }}>Delete group</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={boardMenuAnchor}
        open={Boolean(boardMenuAnchor)}
        onClose={() => setBoardMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2, py: 0.5 } } }}
      >
        {targetBoards.map((board) => (
          <MenuItem
            key={board.id}
            onClick={() => {
              moveGroupToBoard(group.id, board.id);
              closeContextMenu();
            }}
          >
            <DashboardCustomizeIcon sx={{ fontSize: 17, mr: 1.25, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 13 }}>{board.name}</Typography>
          </MenuItem>
        ))}
      </Menu>

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

          {/* Full Width inline Add Task table row (Section 4.1 of spec) */}
          {isAdding ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                minHeight: 40,
                pl: 1,
                width: '100%',
              }}
            >
              <Box sx={{ width: 4, bgcolor: group.color, height: 32, mr: 0.5, borderRadius: 0.5 }} />
              <Box sx={{ width: 50, mr: 1 }} />
              <Box sx={{ width: columnsWidth, px: 2, display: 'flex', alignItems: 'center' }}>
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
                     // slight timeout to allow add button clicks
                     setTimeout(handleAddTask, 150);
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
                bgcolor: 'background.paper',
                cursor: 'pointer',
                pl: 1,
                width: '100%',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => setIsAdding(true)}
            >
              <Box sx={{ width: 4, bgcolor: group.color, height: 32, mr: 0.5, borderRadius: 0.5 }} />
              <Box sx={{ width: 50, mr: 1 }} />
              <Button
                startIcon={<AddIcon />}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  fontWeight: 500,
                  fontSize: 13,
                  py: 0.5,
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
