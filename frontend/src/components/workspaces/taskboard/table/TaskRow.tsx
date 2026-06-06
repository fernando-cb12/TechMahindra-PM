// ─── TaskRow — renders a single task row aligned with dynamic header columns (Section 4/7.5 of spec) ───

import { useState } from 'react';
import { Box, Checkbox, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useParams } from 'react-router-dom';
import type { Task, ColumnDefinition } from '../types';
import TaskCell from './TaskCell';
import { useTaskBoard } from '../useTaskBoard';

interface TaskRowProps {
  task: Task;
  columns: ColumnDefinition[];
  groupColor: string;
}

export default function TaskRow({ task, columns, groupColor }: TaskRowProps) {
  const { workspaceId = '', boardId = '' } = useParams();
  const {
    groups,
    availableBoards,
    toggleTaskComplete,
    completedTasks,
    openPanel,
    panel,
    deleteTask,
    moveTaskToGroup,
    moveTaskToBoardGroup,
  } = useTaskBoard();
  const isComplete = completedTasks.has(task.id);
  const isSelected = panel.taskId === task.id;
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<HTMLElement | null>(null);
  const [boardMenuAnchor, setBoardMenuAnchor] = useState<HTMLElement | null>(null);
  const [boardGroupMenuAnchor, setBoardGroupMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [renameSignal, setRenameSignal] = useState(0);
  const columnsWidth = columns.reduce((total, column) => total + (column.width || 120), 0);

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

  const closeContextMenu = () => {
    setContextMenu(null);
    setMoveMenuAnchor(null);
    setBoardMenuAnchor(null);
    setBoardGroupMenuAnchor(null);
    setSelectedBoardId(null);
  };

  const requestRename = () => {
    setRenameSignal((value) => value + 1);
    closeContextMenu();
  };

  const requestDelete = () => {
    closeContextMenu();
    deleteTask(task.id);
  };

  const copyTaskLink = async () => {
    const url = `${window.location.origin}/workspaces/${workspaceId}/boards/${boardId}?task=${task.id}`;
    try {
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(new CustomEvent('app:feedback', { detail: { message: 'Link copied' } }));
    } catch {
      window.dispatchEvent(new CustomEvent('app:feedback', { detail: { message: url } }));
    }
    closeContextMenu();
  };

  const targetBoards = availableBoards.filter((board) => board.id !== task.workspaceId);
  const selectedBoard = targetBoards.find((board) => board.id === selectedBoardId) ?? null;

  return (
    <>
      <Box
        ref={setNodeRef}
        style={style}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ mouseX: e.clientX + 2, mouseY: e.clientY - 6 });
        }}
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
          minHeight: 42,
          width: '100%',
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
          bgcolor: alpha(groupColor, 0.08),
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
          flex: `0 0 ${columnsWidth}px`,
          width: columnsWidth,
          opacity: isComplete ? 0.6 : 1,
        }}
      >
        {columns.map((col, index) => {
          const isFirst = index === 0;
          return (
            <Box
              key={col.id}
              onClick={(e) => {
                // If clicking the name column (or any area not directly an input/selector), open panel
                const target = e.target as HTMLElement;
                const isInteractive = target.tagName === 'INPUT' || target.closest('button') || target.closest('.MuiChip-root') || target.closest('.MuiAvatar-root') || target.closest('[data-task-name-cell="true"]');
                if (isFirst && !isInteractive) {
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
                py: 0.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Pass column and taskId directly for maximum flexibility */}
                <TaskCell taskId={task.id} column={col} renameSignal={isFirst ? renameSignal : 0} />
              </Box>
              
              {/* Updates indicator on the first column */}
              {isFirst && task.updates && task.updates.length > 0 && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPanel(task.id);
                  }}
                  sx={{ p: 0.5, ml: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Spacer to align with final '+' Add Column Header */}
      <Box
        sx={{
          width: 40,
          bgcolor: alpha(groupColor, 0.02),
        }}
      />
      </Box>

      <Menu
        open={Boolean(contextMenu)}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 2, py: 0.5 } } }}
      >
        <MenuItem onClick={requestRename}>
          <DriveFileRenameOutlineIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Rename item</Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
          disabled={groups.length <= 1}
        >
          <DriveFileMoveIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Move to group</Typography>
        </MenuItem>
        <MenuItem
          onClick={(e) => setBoardMenuAnchor(e.currentTarget)}
          disabled={targetBoards.length === 0}
        >
          <DashboardCustomizeIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Change board</Typography>
          <KeyboardArrowRightIcon sx={{ fontSize: 16, ml: 'auto', color: 'text.secondary' }} />
        </MenuItem>
        <MenuItem onClick={copyTaskLink}>
          <LinkIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Copy task link</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={requestDelete} sx={{ color: 'error.main' }}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1.25 }} />
          <Typography sx={{ fontSize: 13 }}>Delete item</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moveMenuAnchor}
        open={Boolean(moveMenuAnchor)}
        onClose={() => setMoveMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, py: 0.5 } } }}
      >
        {groups.map((group) => (
          <MenuItem
            key={group.id}
            disabled={group.id === task.groupId}
            onClick={() => {
              moveTaskToGroup(task.id, group.id);
              closeContextMenu();
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: group.color, mr: 1 }} />
            <Typography sx={{ fontSize: 13 }}>{group.name}</Typography>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={boardMenuAnchor}
        open={Boolean(boardMenuAnchor)}
        onClose={() => {
          setBoardMenuAnchor(null);
          setBoardGroupMenuAnchor(null);
          setSelectedBoardId(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2, py: 0.5 } } }}
      >
        {targetBoards.map((board) => (
          <MenuItem
            key={board.id}
            disabled={board.groups.length === 0}
            onClick={(e) => {
              setSelectedBoardId(board.id);
              setBoardGroupMenuAnchor(e.currentTarget);
            }}
          >
            <DashboardCustomizeIcon sx={{ fontSize: 17, mr: 1.25, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 13 }}>{board.name}</Typography>
            <KeyboardArrowRightIcon sx={{ fontSize: 16, ml: 'auto', color: 'text.secondary' }} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={boardGroupMenuAnchor}
        open={Boolean(boardGroupMenuAnchor)}
        onClose={() => {
          setBoardGroupMenuAnchor(null);
          setSelectedBoardId(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 190, borderRadius: 2, py: 0.5 } } }}
      >
        {selectedBoard?.groups.map((group) => (
          <MenuItem
            key={group.id}
            onClick={() => {
              moveTaskToBoardGroup(task.id, selectedBoard.id, group.id);
              closeContextMenu();
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: group.color, mr: 1 }} />
            <Typography sx={{ fontSize: 13 }}>{group.name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
