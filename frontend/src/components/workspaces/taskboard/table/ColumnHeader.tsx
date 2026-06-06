import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTaskBoard } from '../useTaskBoard';
import type { ColumnDefinition, ColumnType, SelectOption } from '../types';
import { getMetricCatalog, updateMetricFieldMapping, type MetricSemanticField } from '../../../../services/metricsService';
import { showAppError, showAppNotification } from '../../../shared/appNotifications';

const generateColumnId = () => `col_${Date.now()}`;

interface ColumnHeaderProps {
  groupColor?: string;
}

const QUICK_COLUMNS: { label: string; type: ColumnType; options?: SelectOption[] }[] = [
  { label: 'Status', type: 'status' as ColumnType, options: [
    { id: 'todo', label: 'To Do', color: '#B3B3B3', workflowMeaning: 'new' },
    { id: 'in_progress', label: 'In Progress', color: '#EAC24F', workflowMeaning: 'in_progress' },
    { id: 'review', label: 'Review', color: '#A3334D' },
    { id: 'done', label: 'Done', color: '#4CAF50', workflowMeaning: 'done' },
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

type SemanticMappingKey = 'budget' | 'progress' | 'due_date' | 'priority' | 'effort';

const SEMANTIC_COMPATIBLE_TYPES: Record<SemanticMappingKey, ColumnType[]> = {
  budget: ['number', 'currency', 'budget'],
  progress: ['number', 'percentage', 'progress'],
  due_date: ['date', 'timeline'],
  priority: ['priority', 'singleSelect'],
  effort: ['number', 'time'],
};

const isColumnCompatibleWithSemantic = (column: ColumnDefinition | null, semanticKey: SemanticMappingKey) => (
  Boolean(column && SEMANTIC_COMPATIBLE_TYPES[semanticKey].includes(column.type))
);

const coreSourceKeyForColumn = (column: ColumnDefinition, semanticKey: SemanticMappingKey) => {
  if (semanticKey === 'budget' && column.type === 'budget') return 'budget';
  if (semanticKey === 'progress' && column.type === 'progress') return 'progress';
  if (semanticKey === 'due_date' && column.id === 'col_due_date') return 'due_date';
  if (semanticKey === 'priority' && column.type === 'priority') return 'priority';
  return null;
};

type PendingMapping = {
  semanticKey: SemanticMappingKey;
  sourceType: 'core_field' | 'custom_field';
  sourceKey: string;
  columnLabel: string;
  currentMapping: MetricSemanticField;
};

export default function ColumnHeader({ groupColor }: ColumnHeaderProps) {
  const { boardId } = useParams<{ workspaceId: string; boardId: string }>();
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
  const [mappingMenuAnchor, setMappingMenuAnchor] = useState<HTMLElement | null>(null);
  const [fieldTypeMenuAnchor, setFieldTypeMenuAnchor] = useState<HTMLElement | null>(null);
  const [pendingMapping, setPendingMapping] = useState<PendingMapping | null>(null);

  const visibleColumns = boardConfig.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order);
  const columnsWidth = visibleColumns.reduce((total, column) => total + (column.width || 120), 0);

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
    setMappingMenuAnchor(null);
    setFieldTypeMenuAnchor(null);
  };

  const closeColumnMenus = () => {
    setSettingsAnchor(null);
    setMappingMenuAnchor(null);
    setFieldTypeMenuAnchor(null);
  };

  const handleRenameSave = () => {
    if (selectedColumn && renameValue.trim() && renameValue !== selectedColumn.label) {
      const updated = boardConfig.columns.map((c) =>
        c.id === selectedColumn.id ? { ...c, label: renameValue } : c
      );
      updateColumns(updated);
    }
    setIsRenaming(false);
    closeColumnMenus();
  };

  const handleChangeType = (newType: ColumnType) => {
    if (selectedColumn) {
      const updated = boardConfig.columns.map((c) =>
        c.id === selectedColumn.id ? { ...c, type: newType } : c
      );
      updateColumns(updated);
    }
    closeColumnMenus();
  };

  const handleDeleteColumn = () => {
    if (selectedColumn && !selectedColumn.isSystemColumn) {
      const updated = boardConfig.columns.filter((c) => c.id !== selectedColumn.id);
      updateColumns(updated);
    }
    closeColumnMenus();
  };

  const handleHideColumn = () => {
    if (selectedColumn) {
      const updated = boardConfig.columns.map((c) =>
        c.id === selectedColumn.id ? { ...c, isVisible: false } : c
      );
      updateColumns(updated);
    }
    closeColumnMenus();
  };

  const saveMetricMapping = async (semanticKey: SemanticMappingKey, sourceType: 'core_field' | 'custom_field', sourceKey: string, columnLabel: string) => {
    if (!boardId) return;
    try {
      await updateMetricFieldMapping(boardId, semanticKey, { sourceType, sourceKey });
      window.dispatchEvent(new CustomEvent('metric-field-mapping-updated', { detail: { boardId } }));
      showAppNotification({ message: `${columnLabel} mapped as ${semanticKey}`, severity: 'success' });
    } catch (e) {
      showAppError(e, `Failed to map ${columnLabel}`);
    } finally {
      setPendingMapping(null);
      closeColumnMenus();
    }
  };

  const handleMapColumn = async (semanticKey: SemanticMappingKey) => {
    if (!selectedColumn || !boardId) return;
    const coreSourceKey = coreSourceKeyForColumn(selectedColumn, semanticKey);
    const sourceType = coreSourceKey ? 'core_field' : 'custom_field';
    const sourceKey = coreSourceKey ?? selectedColumn.id;
    const columnLabel = selectedColumn.label;
    try {
      const catalog = await getMetricCatalog({ boardIds: [boardId] });
      const currentMapping = catalog.semanticFields.find((field) => field.boardId === boardId && field.semanticKey === semanticKey);
      const isSameMapping = currentMapping?.sourceType === sourceType && currentMapping.sourceKey === sourceKey;
      if (currentMapping && !isSameMapping) {
        setPendingMapping({ semanticKey, sourceType, sourceKey, columnLabel, currentMapping });
        return;
      }
      await saveMetricMapping(semanticKey, sourceType, sourceKey, columnLabel);
    } catch (e) {
      showAppError(e, `Failed to map ${columnLabel}`);
      closeColumnMenus();
    }
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
        width: '100%',
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
      <Box sx={{ display: 'flex', flex: `0 0 ${columnsWidth}px`, width: columnsWidth }}>
        {visibleColumns.map((col) => {
          const isSystem = col.id === 'col_name';
          return (
              <Box
              key={col.id}
              group-hover="header"
              onContextMenu={(e) => {
                if (!isSystem) handleOpenSettings(e, col);
                e.preventDefault();
              }}
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
        onClose={closeColumnMenus}
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
        <MenuItem
          onClick={(event) => setMappingMenuAnchor(event.currentTarget)}
          sx={{ py: 1, display: 'flex', justifyContent: 'space-between', gap: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LinkIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography sx={{ fontSize: 13 }}>Metrics Mapping</Typography>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </MenuItem>
        <MenuItem
          disabled={selectedColumn?.isSystemColumn}
          onClick={(event) => setFieldTypeMenuAnchor(event.currentTarget)}
          sx={{ py: 1, display: 'flex', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography sx={{ fontSize: 13 }}>Change Field Type</Typography>
          <ChevronRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleHideColumn} sx={{ py: 1 }}>
          <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: 13 }}>Hide Column</Typography>
        </MenuItem>
        <MenuItem disabled={selectedColumn?.isSystemColumn} onClick={handleDeleteColumn} sx={{ color: 'error.main', py: 1 }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: 13 }}>Delete Column</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={mappingMenuAnchor}
        open={Boolean(mappingMenuAnchor)}
        onClose={() => setMappingMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { ml: 0.5, minWidth: 190, borderRadius: 2 } } }}
      >
        <MenuItem
          disabled={!isColumnCompatibleWithSemantic(selectedColumn, 'budget')}
          onClick={() => void handleMapColumn('budget')}
          sx={{ py: 0.75 }}
        >
          <Typography sx={{ fontSize: 13 }}>Map as Budget</Typography>
        </MenuItem>
        <MenuItem
          disabled={!isColumnCompatibleWithSemantic(selectedColumn, 'progress')}
          onClick={() => void handleMapColumn('progress')}
          sx={{ py: 0.75 }}
        >
          <Typography sx={{ fontSize: 13 }}>Map as Progress</Typography>
        </MenuItem>
        <MenuItem
          disabled={!isColumnCompatibleWithSemantic(selectedColumn, 'due_date')}
          onClick={() => void handleMapColumn('due_date')}
          sx={{ py: 0.75 }}
        >
          <Typography sx={{ fontSize: 13 }}>Map as Due Date</Typography>
        </MenuItem>
        <MenuItem
          disabled={!isColumnCompatibleWithSemantic(selectedColumn, 'priority')}
          onClick={() => void handleMapColumn('priority')}
          sx={{ py: 0.75 }}
        >
          <Typography sx={{ fontSize: 13 }}>Map as Priority</Typography>
        </MenuItem>
        <MenuItem
          disabled={!isColumnCompatibleWithSemantic(selectedColumn, 'effort')}
          onClick={() => void handleMapColumn('effort')}
          sx={{ py: 0.75 }}
        >
          <Typography sx={{ fontSize: 13 }}>Map as Effort</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={fieldTypeMenuAnchor}
        open={Boolean(fieldTypeMenuAnchor)}
        onClose={() => setFieldTypeMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { ml: 0.5, minWidth: 190, borderRadius: 2, maxHeight: 360 } } }}
      >
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
      </Menu>

      <Dialog open={Boolean(pendingMapping)} onClose={() => setPendingMapping(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 18 }}>
          Replace {pendingMapping?.currentMapping.label} mapping?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {pendingMapping?.currentMapping.label} is currently mapped to{' '}
            <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {pendingMapping?.currentMapping.sourceLabel}
            </Box>
            . Changing it to{' '}
            <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {pendingMapping?.columnLabel}
            </Box>{' '}
            will affect every metric that reads this semantic field for this board.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingMapping(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!pendingMapping) return;
              void saveMetricMapping(
                pendingMapping.semanticKey,
                pendingMapping.sourceType,
                pendingMapping.sourceKey,
                pendingMapping.columnLabel
              );
            }}
          >
            Replace mapping
          </Button>
        </DialogActions>
      </Dialog>

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
