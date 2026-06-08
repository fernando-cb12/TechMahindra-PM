import type { ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';

export interface SummaryCardData {
  label: string;
  value: string | number;
  subtitle?: string;
  helper?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

interface SummaryCardsProps {
  items: SummaryCardData[];
  sx?: SxProps<Theme>;
}

const toneStyles = {
  primary: { color: '#5F0229', soft: 'rgba(95, 2, 41, 0.08)' },
  success: { color: '#067647', soft: 'rgba(6, 118, 71, 0.1)' },
  warning: { color: '#9A6700', soft: 'rgba(234, 194, 79, 0.18)' },
  danger: { color: '#D92D20', soft: 'rgba(217, 45, 32, 0.1)' },
} as const;

function SummaryCards({ items, sx }: SummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 2,
        ...sx,
      }}
    >
      {items.map((item) => {
        const tone = toneStyles[item.tone ?? 'primary'];

        return (
          <Card
            key={item.label}
            sx={{
              borderRadius: '5px',
              boxShadow: 'none',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              minHeight: 146,
            }}
          >
            <CardContent sx={{ p: 2.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    component="div"
                    sx={{
                      mt: 1.25,
                      fontWeight: 900,
                      color: (theme) =>
                        theme.palette.mode === 'dark' ? theme.palette.text.primary : tone.color,
                      fontSize: { xs: 30, sm: 34 },
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </Typography>
                  {item.subtitle ? (
                    <Typography sx={{ mt: 1, color: 'text.primary', fontSize: 14, fontWeight: 600 }}>
                      {item.subtitle}
                    </Typography>
                  ) : null}
                </Box>
                {item.icon ? (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '5px',
                      display: 'grid',
                      placeItems: 'center',
                      color: (theme) =>
                        theme.palette.mode === 'dark' ? theme.palette.text.primary : tone.color,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.08)
                          : tone.soft,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                ) : null}
              </Box>

              {item.helper ? (
                <Typography sx={{ mt: 2, fontSize: 13, color: 'text.secondary', lineHeight: 1.45 }}>
                  {item.helper}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default SummaryCards;
