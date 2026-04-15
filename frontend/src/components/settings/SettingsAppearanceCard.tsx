import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { SettingsCard } from './SettingsCard';
import { settingsMaroon as maroon } from './settingsTokens';

type ThemeChoice = 'light' | 'dark';

function SettingsAppearanceCard() {
  const [applied, setApplied] = useState<ThemeChoice>('light');

  return (
    <SettingsCard>
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: maroon,
            mb: 2,
          }}
        >
          Appearance
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <ThemePreview
            variant="light"
            onApply={() => setApplied('light')}
            isApplied={applied === 'light'}
          />
          <ThemePreview
            variant="dark"
            onApply={() => setApplied('dark')}
            isApplied={applied === 'dark'}
          />
        </Stack>
      </Box>
    </SettingsCard>
  );
}

function ThemePreview({
  variant,
  onApply,
  isApplied,
}: {
  variant: ThemeChoice;
  onApply: () => void;
  isApplied: boolean;
}) {
  const isLight = variant === 'light';
  const innerBg = isLight ? '#f5f5f5' : '#2c2c2c';
  const bar = isLight ? '#fff' : '#444';
  const barMidH = isLight ? 33 : 33;
  const barBtnH = isLight ? 43 : 48;

  return (
    <Box sx={{ flex: 1, minWidth: 0, maxWidth: 280 }}>
      <Box
        sx={{
          border: `3px solid ${maroon}`,
          borderRadius: '2px',
          p: 0,
          bgcolor: maroon,
        }}
      >
        <Box sx={{ ml: '12px', bgcolor: innerBg, pt: 1.25, px: 1.25, pb: 1.25 }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
            <Box sx={{ height: 23, width: 53, bgcolor: bar, borderRadius: '5px' }} />
            <Box sx={{ height: 23, width: 53, bgcolor: bar, borderRadius: '5px' }} />
            <Box sx={{ height: 23, width: 53, bgcolor: bar, borderRadius: '5px' }} />
          </Stack>
          <Box sx={{ height: barMidH, width: '100%', maxWidth: 179, bgcolor: bar, borderRadius: '5px', mb: 1 }} />
          <Stack direction="row" spacing={0.75}>
            <Box sx={{ height: barBtnH, width: 76, bgcolor: bar, borderRadius: '5px' }} />
            <Box sx={{ height: barBtnH, width: 76, bgcolor: bar, borderRadius: '5px' }} />
          </Stack>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
        {isApplied ? (
          <Button
            disabled
            variant="contained"
            disableElevation
            sx={{
              bgcolor: 'rgba(95, 2, 41, 0.35)',
              color: '#fff',
              borderRadius: '5px',
              minWidth: 76,
              minHeight: 28,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
            }}
          >
            Applied
          </Button>
        ) : (
          <Button
            variant="contained"
            disableElevation
            onClick={onApply}
            sx={{
              bgcolor: maroon,
              borderRadius: '5px',
              minWidth: 76,
              minHeight: 28,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              '&:hover': { bgcolor: '#4a011f' },
            }}
          >
            Apply
          </Button>
        )}
      </Box>
    </Box>
  );
}

export { SettingsAppearanceCard };
