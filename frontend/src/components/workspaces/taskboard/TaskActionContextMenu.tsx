import { useState } from 'react';
import { Box, Button, Divider, Menu, MenuItem, TextField, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTaskBoard } from './useTaskBoard';

interface MenuPosition {
  mouseX: number;
  mouseY: number;
}

interface TaskActionContextMenuProps {
  taskId: string | null;
  position: MenuPosition | null;
  onClose: () => void;
  showDateActions?: boolean;
}

export default function TaskActionContextMenu({ taskId, position, onClose, showDateActions = false }: TaskActionContextMenuProps) {
  const { tasks, groups, openPanel, updateTask, moveTaskToGroup, deleteTask } = useTaskBoard();
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const task = taskId ? tasks[taskId] : null;

  const closeAll = () => {
    setMoveMenuAnchor(null);
    setIsRenaming(false);
    setRenameDraft('');
    onClose();
  };

  const startRename = () => {
    if (!task) return;
    setRenameDraft(task.name);
    setIsRenaming(true);
  };

  const commitRename = () => {
    if (!task) return;
    const nextName = renameDraft.trim();
    if (nextName && nextName !== task.name) {
      updateTask(task.id, { name: nextName });
    }
    closeAll();
  };

  const deleteCurrentTask = () => {
    if (!task) return;
    deleteTask(task.id);
    closeAll();
  };

  return (
    <>
      <Menu
        open={Boolean(position && task)}
        onClose={closeAll}
        anchorReference="anchorPosition"
        anchorPosition={position ? { top: position.mouseY, left: position.mouseX } : undefined}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, py: 0.5 } } }}
      >
        <MenuItem
          onClick={() => {
            if (task) openPanel(task.id);
            closeAll();
          }}
        >
          <OpenInNewIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Open details</Typography>
        </MenuItem>
        {isRenaming ? (
          <Box sx={{ px: 1.25, py: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitRename();
                if (event.key === 'Escape') closeAll();
              }}
              autoFocus
              fullWidth
              inputProps={{ 'aria-label': 'Rename item' }}
              sx={{ '& .MuiInputBase-root': { height: 34, borderRadius: 1.5, fontSize: 13 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
              <Button size="small" onClick={closeAll} sx={{ textTransform: 'none', fontSize: 12 }}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={commitRename}
                disabled={!renameDraft.trim()}
                sx={{ textTransform: 'none', fontSize: 12, borderRadius: 1.25 }}
              >
                Save
              </Button>
            </Box>
          </Box>
        ) : (
          <MenuItem onClick={startRename}>
            <DriveFileRenameOutlineIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 13 }}>Rename item</Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={(event) => setMoveMenuAnchor(event.currentTarget)}
          disabled={!task || groups.length <= 1}
        >
          <DriveFileMoveIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: 13 }}>Move to group</Typography>
          <KeyboardArrowRightIcon sx={{ fontSize: 16, ml: 'auto', color: 'text.secondary' }} />
        </MenuItem>
        {showDateActions && task && (
          <MenuItem
            onClick={() => {
              updateTask(task.id, { dueDate: null });
              closeAll();
            }}
          >
            <EventBusyIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 13 }}>Clear due date</Typography>
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={deleteCurrentTask} sx={{ color: 'error.main' }}>
          <DeleteOutlineIcon sx={{ fontSize: 18, mr: 1.25 }} />
          <Typography sx={{ fontSize: 13 }}>Delete item</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moveMenuAnchor}
        open={Boolean(moveMenuAnchor && task)}
        onClose={() => setMoveMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, py: 0.5 } } }}
      >
        {groups.map((group) => (
          <MenuItem
            key={group.id}
            disabled={group.id === task?.groupId}
            onClick={() => {
              if (task) moveTaskToGroup(task.id, group.id);
              closeAll();
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
