import { Box, Paper, Typography } from '@mui/material';

function WorkspaceMetricsSection(): React.ReactNode {

  // Mock metric data
  const metricData = {
    label: 'Team Workload',
    segments: [
      { name: 'Development', value: 35, color: '#FF6B6B' },
      { name: 'Design', value: 25, color: '#4ECDC4' },
      { name: 'Testing', value: 20, color: '#FFE66D' },
      { name: 'Documentation', value: 20, color: '#95E1D3' },
    ],
  };

  const size = 140;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;
  const segments = metricData.segments.map((segment) => {
    const offset = circumference * (segment.value / 100);
    const dashArray = `${offset} ${circumference}`;
    const transform = `rotate(${currentAngle} ${size / 2} ${size / 2})`;
    currentAngle += (segment.value / 100) * 360;

    return {
      ...segment,
      dashArray,
      transform,
    };
  });

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '5px',
        p: 3,
        minHeight: 340,
        maxHeight: 460,
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.primary.main,
          mb: 2,
        }}
      >
        Metrics
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <svg width={size} height={size} style={{ maxWidth: '100%' }}>
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={segment.dashArray}
              transform={segment.transform}
              style={{ opacity: 0.8 }}
            />
          ))}
        </svg>

        <Typography
          sx={{
            mt: 2,
            fontWeight: 700,
            fontSize: 14,
            color: 'text.primary',
            textAlign: 'center',
          }}
        >
          {metricData.label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        {metricData.segments.map((segment) => (
          <Box key={segment.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: segment.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', flex: 1 }}>
              {segment.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: 'text.primary',
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {segment.value}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default WorkspaceMetricsSection;
