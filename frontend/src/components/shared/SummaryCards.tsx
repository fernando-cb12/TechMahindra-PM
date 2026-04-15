import { Box, Card, CardContent, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SummaryCardData {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary';
}

interface SummaryCardsProps {
  items: SummaryCardData[];
  sx?: SxProps<Theme>;
}

function SummaryCards({ items, sx }: SummaryCardsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 1.5, sm: 2, md: 2 },
        mb: 4,
        ...sx,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          sx={{
            flex: { xs: '0 1 100%', sm: '0 1 calc(50% - 8px)', md: '0 1 20%' },
            minWidth: { xs: '100%', sm: '160px', md: '220px' },
            height: { xs: 'auto', sm: '10vh', md: '13vh' },
            minHeight: { xs: '90px', sm: '100px', md: '120px' },
            borderRadius: 1.5,
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2 }, textAlign: 'center', width: '100%' }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              }}
            >
              {item.value}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                mt: 0.5,
                color: 'primary.main',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              }}
            >
              {item.label}
            </Typography>
            {item.subtitle ? (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: 'block',
                  color: 'primary.main',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                }}
              >
                {item.subtitle}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default SummaryCards;
