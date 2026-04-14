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
        gap: 2,
        mb: 4,
        ...sx,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          sx={{
            flex: '0 1 20%',
            minWidth: 220,
            height: '15vh',
            borderRadius: 1,
            boxShadow: 'none',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CardContent sx={{ p: 2, textAlign: 'center', width: '100%' }}>
            <Typography
              variant="h5"
              component="div"
              sx={{ fontWeight: 700, color: 'primary.main' }}
            >
              {item.value}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ mt: 0.5, color: 'primary.main', fontWeight: 600 }}
            >
              {item.label}
            </Typography>
            {item.subtitle ? (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'primary.main' }}>
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
