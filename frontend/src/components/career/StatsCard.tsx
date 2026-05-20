import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';

export type StatCardData = {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  iconBg?: string;
};

interface StatCardProps {
  card: StatCardData;
}

export const StatCard: React.FC<StatCardProps> = ({ card }) => {
  const dark = card.highlight;

  return (
    <Paper
      elevation={dark ? 4 : 1}
      sx={(theme) => ({
        flex: 1,
        minWidth: 120,
        p: '24px 20px',
        borderRadius: '18px',

        border: dark ? 'none' : '1px solid',

        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.100',

        bgcolor: dark ? 'transparent' : 'background.paper',

        background: dark
          ? 'linear-gradient(145deg, #6b1f3a 0%, #4a1028 100%)'
          : undefined,

        boxShadow: dark
          ? '0 8px 32px rgba(0,0,0,0.45)'
          : theme.palette.mode === 'dark'
            ? '0 4px 18px rgba(0,0,0,0.30)'
            : '0 2px 12px rgba(0,0,0,0.05)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,

        position: 'relative',
        overflow: 'hidden',

        cursor: 'default',

        transition: 'transform 0.18s ease, box-shadow 0.18s ease',

        '&:hover': {
          transform: 'translateY(-4px)',

          boxShadow: dark
            ? '0 16px 40px rgba(0,0,0,0.55)'
            : theme.palette.mode === 'dark'
              ? '0 8px 28px rgba(0,0,0,0.40)'
              : '0 8px 24px rgba(0,0,0,0.10)',
        },
      })}
    >
      {dark && (
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Icon */}
      <Box
        sx={(theme) => ({
          width: 46,
          height: 46,
          borderRadius: '13px',

          bgcolor: dark
            ? 'rgba(255,255,255,0.15)'
            : (card.iconBg ??
              (theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : '#f0eeff')),

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
        })}
      >
        {card.icon}
      </Box>

      {/* Label */}
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: dark ? 'rgba(255,255,255,0.60)' : 'text.secondary',
        }}
      >
        {card.label}
      </Typography>

      {/* Value */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '26px',
          letterSpacing: '-0.5px',
          color: dark ? '#fff' : 'text.primary',
          lineHeight: 1,
        }}
      >
        {card.value}
      </Typography>
    </Paper>
  );
};

interface StatCardsProps {
  cards: StatCardData[];
}

const StatCards: React.FC<StatCardsProps> = ({ cards }) => {
  return (
    <Stack direction="row" spacing={1.75} flexWrap="wrap">
      {cards.map((card) => (
        <StatCard key={card.id} card={card} />
      ))}
    </Stack>
  );
};

export default StatCards;
