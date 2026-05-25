import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

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
          theme.palette.mode === 'dark' ? alpha(theme.palette.grey[50], 0.08) : 'grey.100',

        bgcolor: dark ? 'transparent' : 'background.paper',

        background: dark
          ? `linear-gradient(145deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`
          : undefined,

        boxShadow: dark
          ? `0 8px 32px ${alpha(theme.palette.grey[900], 0.45)}`
          : theme.palette.mode === 'dark'
            ? `0 4px 18px ${alpha(theme.palette.grey[900], 0.3)}`
            : `0 2px 12px ${alpha(theme.palette.grey[900], 0.05)}`,

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
            ? `0 16px 40px ${alpha(theme.palette.grey[900], 0.55)}`
            : theme.palette.mode === 'dark'
              ? `0 8px 28px ${alpha(theme.palette.grey[900], 0.4)}`
              : `0 8px 24px ${alpha(theme.palette.grey[900], 0.1)}`,
        },
      })}
    >
      {dark && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.contrastText, 0.06),
            pointerEvents: 'none',
          })}
        />
      )}

      {/* Icon */}
      <Box
        sx={(theme) => ({
          width: 46,
          height: 46,
          borderRadius: '13px',

          bgcolor: dark
            ? alpha(theme.palette.primary.contrastText, 0.15)
            : theme.palette.mode === 'dark'
              ? alpha(theme.palette.grey[50], 0.06)
              : alpha(theme.palette.primary.light, 0.12),

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          color: dark ? 'primary.contrastText' : 'primary.main',

          '& .MuiSvgIcon-root': {
            fontSize: '22px',
          },
        })}
      >
        {card.icon}
      </Box>

      {/* Label */}
      <Typography
        sx={(theme) => ({
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: dark ? alpha(theme.palette.primary.contrastText, 0.6) : 'text.secondary',
        })}
      >
        {card.label}
      </Typography>

      {/* Value */}
      <Typography
        sx={(theme) => ({
          fontWeight: 800,
          fontSize: '26px',
          letterSpacing: '-0.5px',
          color: dark ? theme.palette.primary.contrastText : 'text.primary',
          lineHeight: 1,
        })}
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
