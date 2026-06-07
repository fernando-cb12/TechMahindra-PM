import { Box, Paper, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { InsightId, MyTasksSummary } from './types';

const INSIGHT_DEFINITIONS: Array<{
  id: InsightId;
  label: string;
  tone?: 'default' | 'risk' | 'success';
}> = [
  { id: 'assigned', label: 'Visible tasks' },
  { id: 'open', label: 'Open' },
  { id: 'inProgress', label: 'In progress' },
  { id: 'dueSoon', label: 'Due soon' },
  { id: 'overdue', label: 'Overdue', tone: 'risk' },
  { id: 'completed', label: 'Completed', tone: 'success' },
  { id: 'stale', label: 'Stale', tone: 'risk' },
];

function InsightCard({
  label,
  value,
  active,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  tone?: 'default' | 'risk' | 'success';
  onClick: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const color = tone === 'risk' ? (isDark ? '#FF8A80' : '#D92D20') : tone === 'success' ? (isDark ? '#6CE9A6' : '#067647') : (isDark ? '#FFFFFF' : '#5F0229');
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        minWidth: 148,
        flex: '1 1 148px',
        borderRadius: 2,
        border: '1px solid',
        borderColor: active ? (isDark ? alpha(color, 0.45) : color) : 'divider',
        bgcolor: active
          ? alpha(color, isDark ? 0.14 : 0.06)
          : isDark
            ? 'background.paper'
            : 'background.paper',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor: isDark ? alpha(color, 0.55) : color,
          bgcolor: isDark ? alpha('#FFFFFF', 0.08) : alpha(color, 0.035),
        },
      }}
    >
      <Typography sx={{ fontSize: 11, color: isDark ? alpha('#FFFFFF', 0.86) : 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: 28, lineHeight: 1, color, fontWeight: 900 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function MyTasksInsights({
  summary,
  selectedInsight,
  onSelectInsight,
}: {
  summary: MyTasksSummary;
  selectedInsight: InsightId | null;
  onSelectInsight: (insight: InsightId | null) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
      {INSIGHT_DEFINITIONS.map((insight) => (
        <InsightCard
          key={insight.id}
          label={insight.label}
          value={summary[insight.id]}
          tone={insight.tone}
          active={selectedInsight === insight.id}
          onClick={() => onSelectInsight(selectedInsight === insight.id ? null : insight.id)}
        />
      ))}
    </Box>
  );
}
