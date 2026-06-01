import { Menu, MenuItem, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkIcon from '@mui/icons-material/Link';
import type { MyTaskListItem } from '../../services/myTasksService';
import type { TaskMenuState } from './types';

export default function MyTaskActionsMenu({
  state,
  task,
  onClose,
  onOpenDetails,
  onOpenInBoard,
  onCopyLink,
}: {
  state: TaskMenuState;
  task: MyTaskListItem | null;
  onClose: () => void;
  onOpenDetails: (task: MyTaskListItem) => void;
  onOpenInBoard: (task: MyTaskListItem) => void;
  onCopyLink: (task: MyTaskListItem) => void;
}) {
  return (
    <Menu
      open={Boolean(state && task)}
      anchorEl={state?.anchor ?? null}
      anchorReference={state?.position ? 'anchorPosition' : 'anchorEl'}
      anchorPosition={state?.position ? { top: state.position.mouseY, left: state.position.mouseX } : undefined}
      onClose={onClose}
      slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, py: 0.5 } } }}
    >
      <MenuItem onClick={() => task && onOpenDetails(task)}>
        <OpenInNewIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 13 }}>Open details</Typography>
      </MenuItem>
      <MenuItem onClick={() => task && onOpenInBoard(task)}>
        <OpenInNewIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 13 }}>Open in board</Typography>
      </MenuItem>
      <MenuItem onClick={() => task && onCopyLink(task)}>
        <LinkIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: 13 }}>Copy task link</Typography>
      </MenuItem>
    </Menu>
  );
}
