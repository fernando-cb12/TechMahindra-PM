import { Box, Menu, MenuItem, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useTaskBoard } from './useTaskBoard';

interface MenuPosition {
  mouseX: number;
  mouseY: number;
}

interface TaskCreateContextMenuProps {
  position: MenuPosition | null;
  onClose: () => void;
  groupId?: string;
  dueDate?: string | null;
}

export default function TaskCreateContextMenu({ position, onClose, groupId, dueDate = null }: TaskCreateContextMenuProps) {
  const { groups, addTaskToGroup } = useTaskBoard();
  const targetGroups = groupId ? groups.filter((group) => group.id === groupId) : groups;

  const handleCreate = (targetGroupId: string) => {
    addTaskToGroup(targetGroupId, { dueDate });
    onClose();
  };

  return (
    <Menu
      open={Boolean(position)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ? { top: position.mouseY, left: position.mouseX } : undefined}
      slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 2, py: 0.5 } } }}
    >
      {targetGroups.map((group) => (
        <MenuItem key={group.id} onClick={() => handleCreate(group.id)}>
          {groupId ? (
            <AddCircleOutlineIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
          ) : (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: group.color, mr: 1.25 }} />
          )}
          <Typography sx={{ fontSize: 13 }}>
            {groupId ? 'Add item here' : `New item in ${group.name}`}
          </Typography>
        </MenuItem>
      ))}
    </Menu>
  );
}
