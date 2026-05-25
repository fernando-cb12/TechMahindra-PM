import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Menu,
  MenuItem,
  TextField,
  Button,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import { useTaskBoard } from '../TaskBoardContext';
import type { ColumnDefinition, ColumnType, SelectOption } from '../types';

const generateColumnId = () => `col_${Date.now()}`;

interface ColumnHeaderProps {
  groupColor?: string;
}

const QUICK_COLUMNS = [
  { label: 'Status', type: 'status' as ColumnType, options: [
    { id: 'todo', label: 'To Do', color: '#B3B3B3' },
    { id: 'in_progress', label: 'In Progress', color: '#EAC24F' },
    { id: 'review', label: 'Review', color: '#A3334D' },
    { id: 'done', label: 'Done', color: '#4CAF50' },
    { id: 'blocked', label: 'Blocked', color: '#FB485B' },
  ]},
  { label: 'Priority', type: 'priority' as ColumnType, options: [
    { id: 'critical', label: 'Critical', color: '#FB485B' },
    { id: 'high', label: 'High', color: '#EAC24F' },
    { id: 'medium', label: 'Medium', color: '#A3334D' },
    { id: 'low', label: 'Low', color: '#20EA37' },
  ]},
  { label: 'Due Date', type: 'date' as ColumnType },
  { label: 'Progress', type: 'progress' as ColumnType },
  { label: 'Cost Estimate', type: 'budget' as ColumnType },
  { label: 'Tags', type: 'multiSelect' as ColumnType, options: [
    { id: 'frontend', label: 'Frontend', color: '#2196F3' },
    { id: 'backend', label: 'Backend', color: '#4CAF50' },
    { id: 'bug', label: 'Bug', color: '#FB485B' },
    { id: 'feature', label: 'Feature', color: '#9C27B0' },
    { id: 'design', label: 'Design', color: '#FF9800' },
  ]},
];

const FIELD_TYPES: { value: ColumnType; label: string }[] = [
  { value: 'shortText', label: 'Short Text' },
  { value: 'longText', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'singleSelect', label: 'Single Select' },
  { value: 'multiSelect', label: 'Multi Select' },
  { value: 'person', label: 'Person' },
  { value: 'file', label: 'File' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'formula', label: 'Formula' },
];

export default function ColumnHeader({ groupColor }: ColumnHeaderProps) {
  const { boardConfig, updateColumns, addColumn } = useTaskBoard();
  
  const [addColumnAnchor, setAddColumnAnchor] = useState<HTMLButtonElement | null>(null);
  
  // Custom Blank Column states
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<ColumnType>('shortText');

  // Column settings menu states
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnDefinition | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);

  const handleOpenAddColumn = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAddColumnAnchor(e.currentTarget);
    setCustomTitle('');
    setCustomType('shortText');
  };

  const handleQuickAdd = useCallback((label: string, type: ColumnType, options?: SelectOption[]) => {
    const colId = generateColumnId();
    const newCol: ColumnDefinition = {
      id: colId,
      label,
      type,
      isVisible: true,
      order: boardConfig.columns.length,
      options: options || [],
    };
    addColumn(newCol);
    setAddColumnAnchor(null);
  }, [boardConfig.columns, addColumn]);

  const handleCreateCustomColumn = useCallback(() => {
    if (!customTitle.trim()) return;
    const colId = generateColumnId();
    const newCol: ColumnDefinition = {
      id: colId,
      label: customTitle,
      type: customType,
      isVisible: true,
      order: boardConfig.columns.length,
      options: customType === 'singleSelect' || customType === 'multiSelect' ? [] : undefined,
    };
    addColumn(newCol);
    setAddColumnAnchor(null);
  }, [customTitle, customType, boardConfig.columns, addColumn]);

  // Header Actions
  const handleOpenSettings = (e: React.MouseEvent<HTMLElement>, col: ColumnDefinition) => {
    e.stopPropagation();
    setSelectedColumn(col);
    setSettingsAnchor(e.currentTarget);
    setRenameValue(col.label);
    setIsRenaming(false);
  };

  const handleRenameSave = () => {
    if (selectedColumn && renameValue.trim() && renameValue !== selectedColumn.label) {
      const updated = boardConfig.columns.map((c) =>
        c.id === selectedColumn.id ? { ...c, label: renameValue } : c
      );
      updateColumns(updated);
    }
    setIsRenaming(false);
    setSettingsAnchor(null);
  };

  const handleChangeType = (newType: ColumnType) => {
    if (selectedColumn) {
      const updated = boardConfig.columns.map((c) =>
        c.id === selectedColumn.id ? { ...c, type: newType } : c
      );
      updateColumns(updated);
    }
    setSettingsAnchor(null);
  };

  const handleDeleteColumn = () => {
    if (selectedColumn) {
      const updated = boardConfig.columns.filter((c) => c.id !== selectedColumn.id);
      updateColumns(updated);
    }
    setSettingsAnchor(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '2px solid',
        borderColor: 'divider',
        minHeight: 38,
        bgcolor: 'background.default',
        zIndex: 1,
      }}
    >
      {/* Spacer for Selection border indicator */}
      <Box sx={{ width: 4 }} />

      {/* Spacer for Checkbox and Drag Handle Area */}
      <Box
        sx={{
          width: 50,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      />

      {/* Dynamic Headers */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {visibleColumns.map((col) => {
          const isSystem = col.id === 'col_name';
          return (
            <Box
              key={col.id}
              group-hover="header"
              sx={{
                flex: col.width ? `0 0 ${col.width}px` : 1,
                minWidth: col.width || 120,
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 0.5,
                position: 'relative',
                '&:hover .column-actions-btn': { opacity: 0.8 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </Typography>

              {/* Column Settings dropdown toggle */}
              {!isSystem && (
                <IconButton
                  size="small"
                  className="column-actions-btn"
                  onClick={(e) => handleOpenSettings(e, col)}
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    p: 0.25,
                    ml: 0.5,
                  }}
                >
                  <ArrowDropDownIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Column settings menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: 2 } } }}
      >
        {isRenaming ? (
          <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              variant="standard"
              sx={{ fontSize: 13 }}
            />
            <IconButton size="small" onClick={handleRenameSave} color="primary">
              <CheckIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <MenuItem onClick={() => setIsRenaming(true)}>
            <Typography sx={{ fontSize: 13 }}>Rename Column</Typography>
          </MenuItem>
        )}
        
        <Divider />
        <Typography sx={{ px: 2, py: 0.75, fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
          Change Field Type
        </Typography>
        {FIELD_TYPES.map((t) => {
          const isSelected = selectedColumn?.type === t.value;
          return (
            <MenuItem
              key={t.value}
              onClick={() => handleChangeType(t.value)}
              selected={isSelected}
              sx={{ py: 0.5 }}
            >
              <Typography sx={{ fontSize: 13 }}>{t.label}</Typography>
            </MenuItem>
          );
        })}

        <Divider />
        <MenuItem onClick={handleDeleteColumn} sx={{ color: 'error.main', py: 1 }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: 13 }}>Delete Column</Typography>
        </MenuItem>
      </Menu>

      {/* Final '+' Column Header (Section 6.1 of spec) */}
      <Box
        sx={{
          width: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '2px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton
          size="small"
          onClick={handleOpenAddColumn}
          sx={{
            color: groupColor || 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
            width: 28,
            height: 28,
          }}
          title="Add Column"
        >
          <AddIcon fontSize="small" />
        </IconButton>

        {/* Add Column Popover Options */}
        <Popover
          open={Boolean(addColumnAnchor)}
          anchorEl={addColumnAnchor}
          onClose={() => setAddColumnAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, p: 2, borderRadius: 2, width: 280, maxHeight: 400, overflowY: 'auto' } } }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>
            Quick Columns
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            {QUICK_COLUMNS.map((col) => (
              <Button
                key={col.label}
                size="small"
                variant="outlined"
                onClick={() => handleQuickAdd(col.label, col.type, col.options)}
                sx={{
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  fontSize: 12.5,
                  py: 0.5,
                  borderRadius: 1.5,
                }}
              >
                + {col.label}
              </Button>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />
          
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase' }}>
            Custom Blank Column
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              size="small"
              label="Column Name"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Due Date"
              fullWidth
              autoFocus
              InputProps={{ sx: { fontSize: 13, borderRadius: 1.5 } }}
              InputLabelProps={{ sx: { fontSize: 13 } }}
            />
            
            <FormControl size="small" fullWidth>
              <InputLabel id="field-type-label" sx={{ fontSize: 13 }}>Field Type</InputLabel>
              <Select
                labelId="field-type-label"
                value={customType}
                onChange={(e) => setCustomType(e.target.value as ColumnType)}
                label="Field Type"
                sx={{ fontSize: 13, borderRadius: 1.5 }}
              >
                {FIELD_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value} sx={{ fontSize: 13 }}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="contained"
              onClick={handleCreateCustomColumn}
              disabled={!customTitle.trim()}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
            >
              Create Column
            </Button>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
}
