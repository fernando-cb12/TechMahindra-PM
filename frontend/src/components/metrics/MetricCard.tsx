import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChartRenderer from './ChartRenderer';
import type { Card, Metric } from './types';

interface MetricCardProps {
  card: Card;
  metric: Metric | undefined;
  isEditMode: boolean;
  onRemove: (cardId: string) => void;
}

function MetricCard({ card, metric, isEditMode, onRemove }: MetricCardProps) {
  if (!metric) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '5px',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 1,
          pb: 0.5,
          minHeight: 32,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {metric.name}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: 'text.secondary',
              lineHeight: 1.2,
            }}
          >
            {card.timeRangeLabel}
          </Typography>
        </Box>

        {isEditMode && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(card.id);
            }}
            sx={{
              width: 20,
              height: 20,
              ml: 0.5,
              zIndex: 2,
              color: 'text.secondary',
              '&:hover': { color: 'error.main' },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>

      {/* Chart body */}
      <Box sx={{ flex: 1, px: 1, pb: 1, minHeight: 0, minWidth: 0 }}>
        <ChartRenderer chartType={card.chartType} data={metric.mockData} />
      </Box>
    </Paper>
  );
}

export default MetricCard;
