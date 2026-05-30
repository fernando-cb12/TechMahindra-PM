import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useDashboard } from './useDashboard';
import { CHART_TYPE_LABELS } from './types';
import type { ChartType } from './types';

function AddMetricModal() {
  const { isAddModalOpen, closeAddModal, addCard, metrics } = useDashboard();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const handleClose = () => {
    closeAddModal();
    // Reset on close
    setTimeout(() => {
      setStep(1);
      setSelectedMetricId(null);
    }, 200);
  };

  const handleMetricSelect = (metricId: string) => {
    setSelectedMetricId(metricId);
    setStep(2);
  };

  const handleChartSelect = (chartType: ChartType) => {
    if (!selectedMetricId) return;
    addCard(selectedMetricId, chartType);
    // Reset
    setStep(1);
    setSelectedMetricId(null);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedMetricId(null);
  };

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);

  const allChartTypes: ChartType[] = ['kpi', 'bar', 'line', 'pie', 'table'];

  return (
    <Dialog
      open={isAddModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          maxHeight: '70vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}
      >
        {step === 2 && (
          <ArrowBackIcon
            sx={{ cursor: 'pointer', fontSize: 20, color: 'text.secondary' }}
            onClick={handleBack}
          />
        )}
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 16 }}>
          {step === 1 ? 'Select a Metric' : 'Select Chart Type'}
        </Typography>
        <Chip
          label={`Step ${step} of 2`}
          size="small"
          sx={{ ml: 'auto', fontSize: 11, height: 22 }}
        />
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {step === 1 && (
          <List disablePadding>
            {metrics.map((metric) => (
              <ListItemButton
                key={metric.id}
                onClick={() => handleMetricSelect(metric.id)}
                sx={{
                  px: 3,
                  py: 1.5,
                  '&:not(:last-child)': {
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  },
                }}
              >
                <ListItemText
                  primary={metric.name}
                  secondary={metric.description}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                  secondaryTypographyProps={{ fontSize: 12, mt: 0.25 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        {step === 2 && selectedMetric && (
          <Box>
            <Box sx={{ px: 3, py: 1.5, bgcolor: 'background.default' }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Metric: <strong>{selectedMetric.name}</strong>
              </Typography>
            </Box>
            <List disablePadding>
              {allChartTypes.map((ct) => {
                const compatible = selectedMetric.compatibleChartTypes.includes(ct);
                return (
                  <ListItemButton
                    key={ct}
                    disabled={!compatible}
                    onClick={() => compatible && handleChartSelect(ct)}
                    sx={{
                      px: 3,
                      py: 1.5,
                      '&:not(:last-child)': {
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    <ListItemText
                      primary={CHART_TYPE_LABELS[ct]}
                      secondary={
                        !compatible ? 'Not available for this metric' : undefined
                      }
                      primaryTypographyProps={{
                        fontWeight: 500,
                        fontSize: 14,
                        color: compatible ? 'text.primary' : 'text.disabled',
                      }}
                      secondaryTypographyProps={{
                        fontSize: 11,
                        color: 'text.disabled',
                        fontStyle: 'italic',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose} size="small" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddMetricModal;
