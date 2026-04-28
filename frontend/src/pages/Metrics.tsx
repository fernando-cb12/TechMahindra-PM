import { Box, Typography } from '@mui/material';

function Metrics() {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 21.5,
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : theme.palette.primary.main,
        }}
      >
        Metrics
      </Typography>
      <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
        Project metrics will appear here.
      </Typography>
    </Box>
  );
}

export default Metrics;
