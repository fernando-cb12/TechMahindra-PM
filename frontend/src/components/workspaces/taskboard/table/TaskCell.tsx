// ─── TaskCell — generic cell renderer per ColumnType (Section 7.5) ───

import { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Box,
  Chip,
  LinearProgress,
  MenuItem,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ColumnType, StatusOption, PriorityOption, User } from '../types';
import { useTaskBoard } from '../TaskBoardContext';

interface TaskCellProps {
  taskId: string;
  columnType: ColumnType;
  value: string | number | null;
}

export default function TaskCell({ taskId, columnType, value }: TaskCellProps) {
  const { boardConfig, users, updateTask } = useTaskBoard();
  const [editing, setEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = (newValue: string | number | null) => {
    const patchKey = columnTypeToPatchKey(columnType);
    if (patchKey) {
      updateTask(taskId, { [patchKey]: newValue });
    }
    setEditing(false);
    setAnchorEl(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (columnType === 'files') return; // placeholder
    if (['status', 'priority', 'assignee'].includes(columnType)) {
      setAnchorEl(e.currentTarget);
    } else {
      setEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (columnType === 'progress') {
        commit(Math.min(100, Math.max(0, Number(draft) || 0)));
      } else if (columnType === 'budget') {
        commit(Number(draft) || 0);
      } else {
        commit(draft);
      }
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setDraft(String(value ?? ''));
    }
  };

  const handleBlur = () => {
    if (editing) {
      if (columnType === 'progress') {
        commit(Math.min(100, Math.max(0, Number(draft) || 0)));
      } else if (columnType === 'budget') {
        commit(Number(draft) || 0);
      } else {
        commit(draft);
      }
    }
  };

  // ── Render by type ──
  switch (columnType) {
    case 'text':
      return editing ? (
        <TextField
          inputRef={inputRef}
          size="small"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          variant="standard"
          sx={{ width: '100%', '& input': { fontSize: 13, py: 0.25 } }}
        />
      ) : (
        <Typography
          onClick={handleClick}
          sx={{
            fontSize: 13,
            fontWeight: 500,
            cursor: 'text',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
          }}
        >
          {String(value ?? '')}
        </Typography>
      );

    case 'status':
      return (
        <>
          <StatusChip
            options={boardConfig.statusOptions}
            value={String(value ?? '')}
            onClick={handleClick}
          />
          <DropdownPopover
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            items={boardConfig.statusOptions}
            onSelect={(id) => commit(id)}
            renderItem={(opt: StatusOption) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: opt.color }} />
                <Typography sx={{ fontSize: 13 }}>{opt.label}</Typography>
              </Box>
            )}
          />
        </>
      );

    case 'priority':
      return (
        <>
          <PriorityChip
            options={boardConfig.priorityOptions}
            value={String(value ?? '')}
            onClick={handleClick}
          />
          <DropdownPopover
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            items={boardConfig.priorityOptions}
            onSelect={(id) => commit(id)}
            renderItem={(opt: PriorityOption) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: opt.color }} />
                <Typography sx={{ fontSize: 13 }}>{opt.label}</Typography>
              </Box>
            )}
          />
        </>
      );

    case 'assignee': {
      const userList = Object.values(users);
      const assigned = value ? users[String(value)] : null;
      return (
        <>
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
            }}
          >
            {assigned ? (
              <>
                <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: 'primary.main' }}>
                  {assigned.initials}
                </Avatar>
                <Typography sx={{ fontSize: 13 }}>{assigned.name}</Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
            )}
          </Box>
          <DropdownPopover
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            items={[{ id: '', name: 'Unassigned', initials: '—', avatarUrl: null } as User, ...userList]}
            onSelect={(id) => commit(id || null)}
            renderItem={(user: User) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: 9, bgcolor: 'primary.main' }}>
                  {user.initials}
                </Avatar>
                <Typography sx={{ fontSize: 13 }}>{user.name}</Typography>
              </Box>
            )}
          />
        </>
      );
    }

    case 'date':
      return editing ? (
        <TextField
          inputRef={inputRef}
          type="date"
          size="small"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value || null);
          }}
          onBlur={() => setEditing(false)}
          variant="standard"
          sx={{ width: '100%', '& input': { fontSize: 13, py: 0.25 } }}
        />
      ) : (
        <Typography
          onClick={handleClick}
          sx={{
            fontSize: 13,
            cursor: 'pointer',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            color: value ? 'text.primary' : 'text.disabled',
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
        >
          {value ? formatDate(String(value)) : '—'}
        </Typography>
      );

    case 'progress': {
      const pVal = Number(value ?? 0);
      return editing ? (
        <TextField
          inputRef={inputRef}
          type="number"
          size="small"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          inputProps={{ min: 0, max: 100 }}
          variant="standard"
          sx={{ width: 60, '& input': { fontSize: 13, py: 0.25 } }}
        />
      ) : (
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
        >
          <LinearProgress
            variant="determinate"
            value={pVal}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: pVal === 100 ? 'success.main' : 'primary.main',
                borderRadius: 3,
              },
            }}
          />
          <Typography sx={{ fontSize: 12, minWidth: 30, textAlign: 'right' }}>
            {pVal}%
          </Typography>
        </Box>
      );
    }

    case 'budget':
      return editing ? (
        <TextField
          inputRef={inputRef}
          type="number"
          size="small"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          variant="standard"
          sx={{ width: 80, '& input': { fontSize: 13, py: 0.25 } }}
          slotProps={{ input: { startAdornment: <Typography sx={{ fontSize: 13, mr: 0.25 }}>$</Typography> } }}
        />
      ) : (
        <Typography
          onClick={handleClick}
          sx={{
            fontSize: 13,
            cursor: 'pointer',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            color: value != null ? 'text.primary' : 'text.disabled',
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
        >
          {value != null ? `$${Number(value).toLocaleString()}` : '—'}
        </Typography>
      );

    case 'files':
      return (
        <Typography
          sx={{
            fontSize: 12,
            color: 'text.disabled',
            fontStyle: 'italic',
            px: 0.5,
            py: 0.25,
          }}
        >
          Coming soon
        </Typography>
      );

    default:
      return null;
  }
}

// ─── Helpers ───

function columnTypeToPatchKey(type: ColumnType): string | null {
  switch (type) {
    case 'text': return 'name';
    case 'assignee': return 'assigneeId';
    case 'status': return 'status';
    case 'priority': return 'priority';
    case 'date': return 'dueDate';
    case 'progress': return 'progress';
    case 'budget': return 'budget';
    default: return null;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ───

function StatusChip({ options, value, onClick }: {
  options: StatusOption[];
  value: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const opt = options.find((o) => o.id === value);
  return (
    <Chip
      label={opt?.label ?? value}
      size="small"
      onClick={onClick}
      sx={{
        height: 24,
        borderRadius: '4px',
        bgcolor: opt?.color ?? '#B3B3B3',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

function PriorityChip({ options, value, onClick }: {
  options: PriorityOption[];
  value: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const opt = options.find((o) => o.id === value);
  return (
    <Chip
      label={opt?.label ?? value}
      size="small"
      onClick={onClick}
      sx={{
        height: 24,
        borderRadius: '4px',
        bgcolor: opt?.color ?? '#B3B3B3',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

function DropdownPopover<T extends { id: string }>({ anchorEl, onClose, items, onSelect, renderItem }: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  items: T[];
  onSelect: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160, py: 0.5 } } }}
    >
      {items.map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => {
            onSelect(item.id);
            onClose();
          }}
          sx={{ py: 0.75, px: 1.5 }}
        >
          {renderItem(item)}
        </MenuItem>
      ))}
    </Popover>
  );
}
