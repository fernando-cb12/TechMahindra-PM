import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { InsightId, MyTasksSummary } from './types';

const INSIGHT_DEFINITIONS: Array<{
  id: InsightId;
  label: string;
  tone?: 'default' | 'risk' | 'success';
}> = [
  { id: 'assigned', label: 'Assigned to me' },
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
  const color = tone === 'risk' ? '#D92D20' : tone === 'success' ? '#067647' : '#5F0229';
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
        borderColor: active ? color : 'divider',
        bgcolor: active ? alpha(color, 0.06) : 'background.paper',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': { borderColor: color },
      }}
    >
      <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
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
