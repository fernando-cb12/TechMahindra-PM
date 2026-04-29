import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { KpiData } from '../types';

interface KpiChartProps {
  data: KpiData;
}

function KpiChart({ data }: KpiChartProps) {
  const trendColor = data.trend !== undefined && data.trend >= 0 ? 'success.main' : 'error.main';
  const TrendIcon =
    data.trend !== undefined && data.trend >= 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 0.5,
      }}
    >
      <Typography
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: '2rem',
          lineHeight: 1.1,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.primary.main,
        }}
      >
        {typeof data.value === 'number' && !Number.isInteger(data.value)
          ? data.value.toFixed(1)
          : data.value}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {data.unit}
      </Typography>

      {data.trend !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
          <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
          <Typography sx={{ fontSize: '0.7rem', color: trendColor, fontWeight: 600 }}>
            {data.trend > 0 ? '+' : ''}
            {data.trend}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default KpiChart;
