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
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 249px))',
        },
        gap: { xs: 1.25, sm: 1.5 },
        mb: 3,
        ...sx,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          sx={{
            width: '100%',
            maxWidth: 249,
            height: 84,
            borderRadius: '5px',
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent sx={{ p: 1.25, textAlign: 'center', width: '100%' }}>
            <Typography
              component="div"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '24px',
                lineHeight: 1,
              }}
            >
              {item.value}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: 'primary.main',
                fontWeight: 400,
                fontSize: '9.5px',
                lineHeight: 1.2,
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
