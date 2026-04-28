import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useColorMode } from '../../app/colorMode';
import { SettingsCard } from './SettingsCard';

type ThemeChoice = 'light' | 'dark';

function SettingsAppearanceCard() {
  const { mode, setMode } = useColorMode();

  return (
    <SettingsCard>
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.text.primary
                : theme.palette.primary.main,
            mb: 2,
          }}
        >
          Appearance
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <ThemePreview
            variant="light"
            onApply={() => setMode('light')}
            isApplied={mode === 'light'}
          />
          <ThemePreview
            variant="dark"
            onApply={() => setMode('dark')}
            isApplied={mode === 'dark'}
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
          border: (theme) => `3px solid ${theme.palette.primary.main}`,
          borderRadius: '2px',
          p: 0,
          bgcolor: 'primary.main',
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
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.35),
              color: 'common.white',
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
              bgcolor: 'primary.main',
              borderRadius: '5px',
              minWidth: 76,
              minHeight: 28,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              '&:hover': { bgcolor: 'primary.dark' },
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
