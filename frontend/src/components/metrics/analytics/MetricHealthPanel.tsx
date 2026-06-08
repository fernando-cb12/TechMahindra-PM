import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { MetricSemanticField } from '../../../services/metricsService';

type MetricHealthPanelProps = {
  warnings: string[];
  semanticFields?: MetricSemanticField[];
  onMapField?: (field: MetricSemanticField) => void;
};

function MetricHealthPanel({ warnings, semanticFields = [], onMapField }: MetricHealthPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const missingSemanticFields = semanticFields.filter((field) => field.missing);
  const semanticWarningPattern = /^(Budget|Progress|Due Date|Priority|Effort) field missing/;
  const visibleWarnings = warnings.filter((warning) => !semanticWarningPattern.test(warning));
  const warningCount = visibleWarnings.length + missingSemanticFields.length;

  if (warningCount === 0) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '5px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? alpha('#FFFFFF', 0.05) : 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>Metric health</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            Validates workflow mappings, custom field compatibility, and scope context for the current view.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" color={warningCount ? 'warning' : 'success'} label={warningCount ? `${warningCount} warning${warningCount === 1 ? '' : 's'}` : 'No warnings'} />
        </Box>
      </Box>
      {visibleWarnings.map((warning) => <Alert key={warning} severity="warning" sx={{ mt: 1.5 }}>{warning}</Alert>)}
      {missingSemanticFields.map((field) => (
        <Alert
          key={`${field.boardId}-${field.semanticKey}`}
          severity="warning"
          sx={{ mt: 1.5, alignItems: 'center' }}
          action={onMapField ? (
            <Button size="small" color="inherit" onClick={() => onMapField(field)}>
              Map field
            </Button>
          ) : undefined}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {field.label} field missing in {field.workspaceName} / {field.boardName}
          </Typography>
          <Typography sx={{ fontSize: 12 }}>
            Map a compatible column so preset metrics can read this board without depending on the column name.
          </Typography>
        </Alert>
      ))}
    </Paper>
  );
}

export default MetricHealthPanel;
