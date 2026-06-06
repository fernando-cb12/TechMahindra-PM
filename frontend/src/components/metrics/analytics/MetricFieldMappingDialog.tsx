import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import type { MetricCatalog, MetricFieldMappingRequest, MetricSemanticField } from '../../../services/metricsService';

type MetricFieldMappingDialogProps = {
  open: boolean;
  field: MetricSemanticField | null;
  catalog?: MetricCatalog | null;
  onClose: () => void;
  onSave: (payload: MetricFieldMappingRequest) => Promise<void>;
};

const COMPATIBLE_TYPES: Record<string, string[]> = {
  budget: ['number', 'currency', 'budget'],
  progress: ['number', 'percentage', 'progress'],
  due_date: ['date', 'timeline'],
  priority: ['priority', 'singleSelect'],
  effort: ['number', 'time'],
};

function MetricFieldMappingDialog({ open, field, catalog, onClose, onSave }: MetricFieldMappingDialogProps) {
  const [selectedValue, setSelectedValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const options = useMemo(() => {
    if (!field) return [];
    const compatibleTypes = COMPATIBLE_TYPES[field.semanticKey] ?? [];
    const customOptions = (catalog?.customFields ?? [])
      .filter((item) => item.boardId === field.boardId)
      .filter((item) => compatibleTypes.includes(item.type))
      .map((item) => ({
        value: `custom_field:${item.key}`,
        label: item.label,
        helper: `${item.boardName ?? field.boardName} · ${item.type}`,
      }));
    return [
      {
        value: `core_field:${field.semanticKey}`,
        label: `Core ${field.label}`,
        helper: `Default ${field.label.toLowerCase()} column`,
      },
      ...customOptions,
    ];
  }, [catalog?.customFields, field]);

  useEffect(() => {
    if (!open || !field) return;
    const current = `${field.sourceType}:${field.sourceKey}`;
    setSelectedValue(options.some((option) => option.value === current) ? current : options[0]?.value ?? '');
  }, [field, open, options]);

  const handleSave = async () => {
    if (!selectedValue) return;
    const [sourceType, sourceKey] = selectedValue.split(':', 2);
    setIsSaving(true);
    try {
      await onSave({ sourceType: sourceType as MetricFieldMappingRequest['sourceType'], sourceKey });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 900, fontSize: 18 }}>
        Map {field?.label ?? 'metric'} field
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
          {field ? `${field.workspaceName} / ${field.boardName}` : ''}
        </Typography>
        <FormControl fullWidth size="small">
          <Select value={selectedValue} onChange={(event) => setSelectedValue(event.target.value)}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{option.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{option.helper}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {options.length <= 1 && (
          <Typography sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary' }}>
            No compatible custom columns were found for this board.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={!selectedValue || isSaving}>
          {isSaving ? 'Saving' : 'Save mapping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MetricFieldMappingDialog;
