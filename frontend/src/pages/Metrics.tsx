import { Box, Typography } from '@mui/material';
import { settingsMaroon as maroon } from '../components/settings/settingsTokens';

function Metrics() {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 21.5,
          color: maroon,
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
