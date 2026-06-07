// ─── TaskCell — generic cell renderer per ColumnType (Section 5/7/8/6.2 of spec) ───

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  LinearProgress,
  MenuItem,
  Popover,
  TextField,
  Typography,
  Tooltip,
  Checkbox,
  Button,
  Slider,
  IconButton,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { ColumnDefinition, SelectOption, WorkflowMeaning } from '../types';
import { useTaskBoard } from '../useTaskBoard';
import { WORKFLOW_MEANING_LABELS, WORKFLOW_MEANING_OPTIONS, normalizeWorkflowMeaning, supportsWorkflowMeaning } from '../workflow';

interface TaskCellProps {
  taskId: string;
  column: ColumnDefinition;
  renameSignal?: number;
}

const PRESET_COLORS = [
  '#B3B3B3', // Gray
  '#EAC24F', // Yellow
  '#A3334D', // Burgundy
  '#4CAF50', // Green
  '#FB485B', // Red
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
];

export default function TaskCell({ taskId, column, renameSignal = 0 }: TaskCellProps) {
  const {
    boardConfig,
    users,
    tasks,
    updateTask,
    updateColumns,
    updateStatusOptions,
    updatePriorityOptions,
  } = useTaskBoard();
  const task = tasks[taskId];

  const [editing, setEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  // Custom states for editors
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  // Select Option states
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [isCreatingOption, setIsCreatingOption] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionColor, setNewOptionColor] = useState(PRESET_COLORS[0]);
  const [newOptionWorkflow, setNewOptionWorkflow] = useState<WorkflowMeaning>('none');
  const optionIdSequence = useRef(0);

  // Color picker for a specific option
  const [optionColorAnchor, setOptionColorAnchor] = useState<HTMLElement | null>(null);
  const [activeColorOptionId, setActiveColorOptionId] = useState<string | null>(null);

  // Extract cell value
  const cellValue = useMemo(() => {
    if (!task) return null;
    if (column.id === 'col_name') return task.name;
    if (column.id === 'col_assignee') return task.assigneeIds;
    if (column.id === 'col_status') return task.status;
    if (column.id === 'col_priority') return task.priority;
    if (column.id === 'col_date') return task.dueDate;
    if (column.id === 'col_progress') return task.progress;
    if (column.id === 'col_budget') return task.budget;
    
    // Custom columns
    return task.values?.[column.id] ?? null;
  }, [task, column]);

  const [draftText, setDraftText] = useState(String(cellValue ?? ''));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDraftText(String(cellValue ?? ''));
  }, [cellValue]);

  useEffect(() => {
    if (column.id === 'col_name' && renameSignal > 0) {
      setEditing(true);
    }
  }, [column.id, renameSignal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!task) return null;

  const boundedPercentage = (val: string | number | string[] | null) => Math.min(100, Math.max(0, Number(val) || 0));

  const commitValue = (val: string | number | string[] | null) => {
    if (column.id === 'col_name') {
      updateTask(taskId, { name: String(val) });
    } else if (column.id === 'col_date') {
      updateTask(taskId, { dueDate: val ? String(val) : null });
    } else if (column.id === 'col_progress') {
      updateTask(taskId, { progress: boundedPercentage(val) });
    } else if (column.id === 'col_budget') {
      updateTask(taskId, { budget: val != null && val !== '' ? Number(val) : null });
    } else if (column.id === 'col_status') {
      updateTask(taskId, { status: String(val) });
    } else if (column.id === 'col_priority') {
      updateTask(taskId, { priority: String(val) });
    } else if (column.id === 'col_assignee' || column.type === 'person') {
      const assigneeIds = Array.isArray(val) ? val.map(String) : [];
      updateTask(taskId, {
        assigneeIds,
        assigneeId: assigneeIds[0] ?? null,
      });
    } else {
      // Custom columns
      const updatedValues = {
        ...(task.values || {}),
        [column.id]: column.type === 'percentage' || column.type === 'progress' ? boundedPercentage(val) : val,
      };
      updateTask(taskId, { values: updatedValues });
    }
    setEditing(false);
    setAnchorEl(null);
  };

  const handleCellClick = (e: React.MouseEvent<HTMLElement>) => {
    if (['status', 'priority', 'assignee', 'singleSelect', 'multiSelect', 'progress', 'percentage'].includes(column.type) || 
        ['col_status', 'col_priority', 'col_assignee', 'col_progress'].includes(column.id)) {
      setAnchorEl(e.currentTarget);
      setIsEditingOptions(false);
      setIsCreatingOption(false);
      setAssigneeSearch('');
    } else {
      setEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitValue(draftText);
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setDraftText(String(cellValue ?? ''));
    }
  };

  // ─── 1. ASSIGNEE CELL EDITOR (Section 5.1/5.2 of spec) ───
  if (column.id === 'col_assignee' || column.type === 'person') {
    const assignedIds = (cellValue as string[]) || [];
    const assignedUsers = assignedIds
      .map((uid) => users[uid])
      .filter((user): user is NonNullable<typeof users[string]> => Boolean(user && user.name));
    const userList = Object.values(users);
    
    const filteredUsers = userList.filter((u) =>
      u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );

    const toggleAssignee = (userId: string) => {
      const nextIds = assignedIds.includes(userId)
        ? assignedIds.filter((id) => id !== userId)
        : [...assignedIds, userId];
      commitValue(nextIds);
    };

    // Tooltip names list
    const tooltipTitle = assignedUsers.map((u) => u.name).join(', ') || 'Unassigned';
    const firstAssignedUser = assignedUsers[0];
    const secondAssignedUser = assignedUsers[1];
    const nameSummary = firstAssignedUser
      ? assignedUsers.length === 1
        ? firstAssignedUser.name
        : secondAssignedUser
          ? assignedUsers.length === 2
            ? `${firstAssignedUser.name} and ${secondAssignedUser.name}`
            : `${firstAssignedUser.name}, ${secondAssignedUser.name} +${assignedUsers.length - 2}`
          : firstAssignedUser.name
      : 'Unassigned';

    return (
      <>
        <Box
          onClick={handleCellClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            minHeight: 30,
            width: '100%',
            px: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {firstAssignedUser ? (
            <Tooltip title={tooltipTitle} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <AvatarGroup
                  max={3}
                  spacing="small"
                  sx={{
                    '& .MuiAvatar-root': {
                      width: 24,
                      height: 24,
                      fontSize: 10,
                      bgcolor: 'primary.main',
                      border: '1.5px solid white',
                    },
                  }}
                >
                  {assignedUsers.map((u) => (
                    <Avatar key={u.id} src={u.avatarUrl ?? undefined}>{u.initials}</Avatar>
                  ))}
                </AvatarGroup>
                
                <Typography sx={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {nameSummary}
                </Typography>
              </Box>
            </Tooltip>
          ) : (
            <Typography sx={{ fontSize: 13, color: 'text.disabled', fontStyle: 'italic' }}>—</Typography>
          )}
        </Box>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { mt: 0.5, width: 220, p: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 } } }}
        >
          <TextField
            size="small"
            placeholder="Search members..."
            value={assigneeSearch}
            onChange={(e) => setAssigneeSearch(e.target.value)}
            fullWidth
            InputProps={{ sx: { fontSize: 12, borderRadius: 1.5 } }}
            autoFocus
          />
          <Divider />
          <Box sx={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isChecked = assignedIds.includes(user.id);
                return (
                  <Box
                    key={user.id}
                    onClick={() => toggleAssignee(user.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Checkbox checked={isChecked} size="small" sx={{ p: 0.5, mr: 0.5 }} />
                    <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 22, height: 22, fontSize: 10, bgcolor: 'primary.light', mr: 1 }}>
                      {user.initials}
                    </Avatar>
                    <Typography sx={{ fontSize: 12.5 }}>{user.name}</Typography>
                  </Box>
                );
              })
            ) : (
              <Typography sx={{ fontSize: 12, color: 'text.disabled', py: 1, textAlign: 'center' }}>
                No members found
              </Typography>
            )}
          </Box>
        </Popover>
      </>
    );
  }

  // ─── 2. SELECT CELLS EDITORS (Status, Priority, custom single/multiSelect) (Section 7.1/7.2 of spec) ───
    const isStatus = column.id === 'col_status' || column.type === 'status';
    const isPriority = column.id === 'col_priority' || column.type === 'priority';
    const isSelect = isStatus || isPriority || column.type === 'singleSelect' || column.type === 'multiSelect';

  if (isSelect) {
    const canUseWorkflowMeaning = supportsWorkflowMeaning(column.type);
    // Determine the options list
    let options: SelectOption[] = [];
    if (isStatus) options = boardConfig.statusOptions;
    else if (isPriority) options = boardConfig.priorityOptions;
    else options = column.options || [];

    const activeOptionId = String(cellValue || '');
    const activeOption = options.find((o) => o.id === activeOptionId);

    // Save select options list globally
    const saveOptions = (newOptions: SelectOption[]) => {
      if (isStatus) {
        updateStatusOptions(newOptions);
      } else if (isPriority) {
        updatePriorityOptions(newOptions);
      } else {
        const updatedCols = boardConfig.columns.map((c) =>
          c.id === column.id ? { ...c, options: newOptions } : c
        );
        updateColumns(updatedCols);
      }
    };

    // Option modifications
    const handleAddOption = () => {
      if (!newOptionLabel.trim()) return;
      optionIdSequence.current += 1;
      const optId = `opt_${optionIdSequence.current}`;
      const newOpt: SelectOption = {
        id: optId,
        label: newOptionLabel,
        color: newOptionColor,
        workflowMeaning: canUseWorkflowMeaning ? newOptionWorkflow : 'none',
      };
      saveOptions([...options, newOpt]);
      setNewOptionLabel('');
      setNewOptionWorkflow('none');
      setIsCreatingOption(false);
    };

    const handleUpdateOptionLabel = (optId: string, label: string) => {
      const updated = options.map((o) => (o.id === optId ? { ...o, label } : o));
      saveOptions(updated);
    };

    const handleUpdateOptionColor = (optId: string, color: string) => {
      const updated = options.map((o) => (o.id === optId ? { ...o, color } : o));
      saveOptions(updated);
      setOptionColorAnchor(null);
    };

    const handleUpdateOptionWorkflow = (optId: string, workflowMeaning: WorkflowMeaning) => {
      const updated = options.map((o) => {
        if (o.id !== optId) return o;
        const current = normalizeWorkflowMeaning(o.workflowMeaning);
        return { ...o, workflowMeaning: current === workflowMeaning ? 'none' : workflowMeaning };
      });
      saveOptions(updated);
    };

    const handleDeleteOption = (optId: string) => {
      const updated = options.filter((o) => o.id !== optId);
      saveOptions(updated);
    };

    return (
      <>
        {activeOption ? (
          <Chip
            label={activeOption.label}
            size="small"
            onClick={handleCellClick}
            sx={{
              height: 24,
              borderRadius: '4px',
              bgcolor: activeOption.color,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              '& .MuiChip-label': { px: 1 },
              '&:hover': { opacity: 0.9 },
            }}
          />
        ) : (
          <Typography
            onClick={handleCellClick}
            sx={{
              fontSize: 13,
              color: 'text.disabled',
              cursor: 'pointer',
              minHeight: 24,
              display: 'flex',
              alignItems: 'center',
              px: 0.5,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            —
          </Typography>
        )}

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { mt: 0.5, width: isEditingOptions || isCreatingOption ? 300 : 220, p: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 } } }}
        >
          {isEditingOptions ? (
            // OPTIONS EDITOR MODE
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <IconButton size="small" onClick={() => setIsEditingOptions(false)}>
                  <ArrowBackIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Edit Options</Typography>
              </Box>

              <Divider />

              <Box sx={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {options.map((opt) => (
                  <Box key={opt.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {/* Circle Color Button */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setActiveColorOptionId(opt.id);
                          setOptionColorAnchor(e.currentTarget);
                        }}
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: opt.color,
                          p: 0,
                          border: '1px solid rgba(0,0,0,0.1)',
                          '&:hover': { bgcolor: opt.color },
                        }}
                      />

                      {/* Option Text Input */}
                      <input
                        value={opt.label}
                        onChange={(e) => handleUpdateOptionLabel(opt.id, e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: 12,
                          border: 'none',
                          outline: 'none',
                          borderBottom: '1px solid transparent',
                          padding: '2px',
                        }}
                        onFocus={(e) => (e.target.style.borderBottom = '1px solid gray')}
                        onBlur={(e) => (e.target.style.borderBottom = '1px solid transparent')}
                      />

                      {/* Delete Option Icon */}
                      <IconButton size="small" onClick={() => handleDeleteOption(opt.id)} sx={{ p: 0.25 }}>
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>

                    {canUseWorkflowMeaning && (
                      <Box sx={{ display: 'flex', gap: 0.5, pl: 2.5, pt: 0.75 }}>
                        {WORKFLOW_MEANING_OPTIONS.map((meaning) => {
                          const isSelected = normalizeWorkflowMeaning(opt.workflowMeaning) === meaning.value;
                          return (
                            <Button
                              key={meaning.value}
                              size="small"
                              variant={isSelected ? 'contained' : 'outlined'}
                              onClick={() => handleUpdateOptionWorkflow(opt.id, meaning.value)}
                              sx={{ minWidth: 0, px: 0.75, py: 0.15, textTransform: 'none', fontSize: 10.5, borderRadius: 1 }}
                            >
                              {meaning.label}
                            </Button>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Sub-Popover color picker */}
              <Popover
                open={Boolean(optionColorAnchor)}
                anchorEl={optionColorAnchor}
                onClose={() => setOptionColorAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                slotProps={{ paper: { sx: { p: 1, mt: 0.5, borderRadius: 1.5 } } }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
                  {PRESET_COLORS.map((color) => (
                    <IconButton
                      key={color}
                      size="small"
                      onClick={() => activeColorOptionId && handleUpdateOptionColor(activeColorOptionId, color)}
                      sx={{
                        width: 20,
                        height: 20,
                        bgcolor: color,
                        '&:hover': { bgcolor: color },
                      }}
                    />
                  ))}
                </Box>
              </Popover>
            </>
          ) : isCreatingOption ? (
            // OPTION CREATION MODE
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <IconButton size="small" onClick={() => setIsCreatingOption(false)}>
                  <ArrowBackIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>New Option</Typography>
              </Box>

              <Divider />

              <TextField
                size="small"
                label="Option Name"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="e.g. In Review"
                fullWidth
                autoFocus
                InputProps={{ sx: { fontSize: 12, borderRadius: 1.5 } }}
                InputLabelProps={{ sx: { fontSize: 12 } }}
              />

              <Box sx={{ my: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  Color Accent
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((color) => {
                    const isSelected = newOptionColor === color;
                    return (
                      <IconButton
                        key={color}
                        size="small"
                        onClick={() => setNewOptionColor(color)}
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: color,
                          border: isSelected ? '1.5px solid black' : 'none',
                          '&:hover': { bgcolor: color },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {canUseWorkflowMeaning && (
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                    Workflow Meaning
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {WORKFLOW_MEANING_OPTIONS.map((meaning) => {
                      const isSelected = newOptionWorkflow === meaning.value;
                      return (
                        <Button
                          key={meaning.value}
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setNewOptionWorkflow(isSelected ? 'none' : meaning.value)}
                          sx={{ minWidth: 0, px: 0.85, py: 0.2, textTransform: 'none', fontSize: 11, borderRadius: 1 }}
                        >
                          {meaning.label}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              )}

              <Button
                size="small"
                variant="contained"
                onClick={handleAddOption}
                disabled={!newOptionLabel.trim()}
                sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
              >
                Add Option
              </Button>
            </>
          ) : (
            // SELECT OPTION PICKER MODE
            <>
              <Box sx={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {options.map((opt) => (
                  (() => {
                    const workflowMeaning = normalizeWorkflowMeaning(opt.workflowMeaning);
                    const workflowLabel = workflowMeaning === 'none' ? null : WORKFLOW_MEANING_LABELS[workflowMeaning];

                    return (
                      <MenuItem
                        key={opt.id}
                        onClick={() => commitValue(opt.id)}
                        selected={opt.id === activeOptionId}
                        sx={{
                          py: 0.75,
                          px: 1,
                          borderRadius: 1.5,
                          mb: 0.25,
                          '&.Mui-selected': { bgcolor: alpha(opt.color, 0.15), '&:hover': { bgcolor: alpha(opt.color, 0.25) } },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', minWidth: 0 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: opt.color, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12.5, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.label}
                          </Typography>
                          {workflowLabel && (
                            <Chip
                              size="small"
                              label={workflowLabel}
                              sx={{
                                height: 20,
                                borderRadius: 1,
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: 'primary.main',
                                bgcolor: alpha('#5F0229', 0.08),
                                border: '1px solid',
                                borderColor: alpha('#5F0229', 0.18),
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })()
                ))}
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setNewOptionWorkflow('none');
                    setIsCreatingOption(true);
                  }}
                  sx={{ textTransform: 'none', fontSize: 11.5, py: 0.25 }}
                >
                  New Option
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditingOptions(true)}
                  sx={{ textTransform: 'none', fontSize: 11.5, py: 0.25, color: 'text.secondary' }}
                >
                  Edit
                </Button>
              </Box>
            </>
          )}
        </Popover>
      </>
    );
  }

  // ─── 3. PROGRESS CELL EDITOR (Section 8.1 of spec) ───
  if (column.id === 'col_progress' || column.type === 'percentage' || column.type === 'progress') {
    const pVal = Number(cellValue ?? 0);
    const draftPercentageValue = Number.isFinite(Number(draftText)) ? boundedPercentage(draftText) : pVal;
    const progressColor = pVal === 100 ? 'success.main' : 'primary.main';
    const editorTitle = column.id === 'col_progress' || column.type === 'progress' ? 'Edit Progress Value' : `Edit ${column.label}`;

    const QUICK_PROGRESS_BUTTONS = [0, 25, 50, 75, 100];

    return (
      <>
        <Box
          onClick={handleCellClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            minHeight: 30,
            width: '100%',
            px: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <LinearProgress
            variant="determinate"
            value={pVal}
            sx={{
              flex: 1,
              height: 7,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: progressColor,
                borderRadius: 3,
              },
            }}
          />
          <Typography sx={{ fontSize: 12, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
            {pVal}%
          </Typography>
        </Box>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          slotProps={{ paper: { sx: { mt: 0.5, p: 2, borderRadius: 2, width: 220, display: 'flex', flexDirection: 'column', gap: 2 } } }}
        >
          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
            {editorTitle}
          </Typography>

          {/* Slider */}
          <Box sx={{ px: 1 }}>
            <Slider
              value={draftPercentageValue}
              min={0}
              max={100}
              onChange={(_, val) => setDraftText(String(Array.isArray(val) ? val[0] : val))}
              onChangeCommitted={(_, val) => commitValue(Array.isArray(val) ? val[0] : val)}
              sx={{ color: progressColor }}
            />
          </Box>

          {/* Numeric text input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              type="number"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => commitValue(draftText)}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              InputProps={{
                endAdornment: <Typography sx={{ fontSize: 13, ml: 0.5 }}>%</Typography>,
                sx: { fontSize: 13, borderRadius: 1.5 }
              }}
              sx={{ width: 80 }}
            />

            <IconButton
              size="small"
              onClick={() => commitValue(draftText)}
              sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider />

          {/* Quick values buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {QUICK_PROGRESS_BUTTONS.map((pct) => (
              <Button
                key={pct}
                size="small"
                variant="outlined"
                onClick={() => commitValue(pct)}
                sx={{
                  minWidth: 0,
                  fontSize: 10,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: progressColor, color: progressColor },
                }}
              >
                {pct}%
              </Button>
            ))}
          </Box>
        </Popover>
      </>
    );
  }

  // ─── 4. DATE CELL EDITOR ───
  if (column.id === 'col_date' || column.type === 'date') {
    const formatDate = (iso: string) => {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return editing ? (
      <TextField
        type="date"
        size="small"
        value={draftText}
        onChange={(e) => {
          setDraftText(e.target.value);
          commitValue(e.target.value || null);
        }}
        onBlur={() => setEditing(false)}
        variant="standard"
        autoFocus
        sx={{ width: '100%', '& input': { fontSize: 13, py: 0.25 } }}
      />
    ) : (
      <Box
        onClick={handleCellClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          minHeight: 30,
          px: 0.5,
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <CalendarMonthIcon sx={{ fontSize: 16, color: cellValue ? 'primary.main' : 'text.disabled' }} />
        <Typography
          sx={{
            fontSize: 13,
            color: cellValue ? 'text.primary' : 'text.disabled',
          }}
        >
          {cellValue ? formatDate(String(cellValue)) : '—'}
        </Typography>
      </Box>
    );
  }

  // ─── 5. BUDGET / COST / NUMERIC CELL EDITOR ───
  if (column.id === 'col_budget' || column.type === 'currency' || column.type === 'number') {
    const isCurrency = column.type === 'currency' || column.id === 'col_budget';
    return editing ? (
      <TextField
        type="number"
        size="small"
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commitValue(draftText)}
        variant="standard"
        autoFocus
        sx={{ width: '100%', '& input': { fontSize: 13, py: 0.25 } }}
        InputProps={{
          startAdornment: isCurrency ? <Typography sx={{ fontSize: 13, mr: 0.25 }}>$</Typography> : null
        }}
      />
    ) : (
      <Typography
        onClick={handleCellClick}
        sx={{
          fontSize: 13,
          cursor: 'text',
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          color: cellValue != null ? 'text.primary' : 'text.disabled',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {cellValue != null ? (isCurrency ? `$${Number(cellValue).toLocaleString()}` : Number(cellValue).toLocaleString()) : '—'}
      </Typography>
    );
  }

  // ─── 6. FILES CELL COMPENDIUM TRIGGER ───
  if (column.type === 'files' || column.type === 'file') {
    const count = task.files?.length || 0;
    return (
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 600,
          color: count > 0 ? 'primary.main' : 'text.disabled',
          px: 0.5,
          py: 0.25,
          cursor: 'default',
        }}
      >
        {count > 0 ? `${count} File${count > 1 ? 's' : ''}` : '—'}
      </Typography>
    );
  }

  // ─── DEFAULT TEXT CELLS ───
  return editing ? (
    <TextField
      size="small"
      value={draftText}
      onChange={(e) => setDraftText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => commitValue(draftText)}
      variant="standard"
      autoFocus
      onClick={(e) => e.stopPropagation()}
      sx={{ width: '100%', '& input': { fontSize: 13, py: 0.25 } }}
    />
  ) : (
    <Typography
      data-task-name-cell={column.id === 'col_name' ? 'true' : undefined}
      onClick={(e) => {
        if (column.id === 'col_name') {
          e.stopPropagation();
        }
        handleCellClick(e);
      }}
      sx={{
        fontSize: 13,
        fontWeight: column.id === 'col_name' ? 600 : 500,
        cursor: 'text',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minHeight: 24,
        display: 'flex',
        alignItems: 'center',
        '&:hover': { bgcolor: 'action.hover' },
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
      }}
    >
      {String(cellValue ?? '')}
    </Typography>
  );
}
