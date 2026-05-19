// Badge.tsx

import React from 'react';
import { Box, Typography, Paper, MenuItem, Select } from '@mui/material';

import type { SelectChangeEvent } from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';

export type BadgeStatus = 'earned' | 'locked';

export type BadgeData = {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  status: BadgeStatus;
  color?: string;
  accentColor?: string;
};

interface BadgeProps {
  badge: BadgeData;
}

export const Badge: React.FC<BadgeProps> = ({ badge }) => {
  const earned = badge.status === 'earned';

  return (
    <Paper
      elevation={earned ? 1 : 0}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: '20px 16px',
        borderRadius: '16px',
        border: '1px solid',

        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.200',

        bgcolor: earned
          ? 'background.paper'
          : theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.03)'
            : 'grey.50',

        filter: earned ? 'none' : 'grayscale(0.7) opacity(0.6)',

        cursor: earned ? 'pointer' : 'default',
        position: 'relative',

        transition: 'transform 0.18s ease, box-shadow 0.18s ease',

        '&:hover': earned
          ? {
              transform: 'translateY(-3px)',
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.45)'
                  : '0 8px 24px rgba(0,0,0,0.12)',
            }
          : {},
      })}
    >
      {!earned && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <LockIcon sx={{ fontSize: 28, color: 'grey.400' }} />
        </Box>
      )}

      {/* Icon */}
      <Box
        sx={(theme) => ({
          width: 52,
          height: 52,
          borderRadius: '14px',

          bgcolor: earned
            ? (badge.color ??
              (theme.palette.mode === 'dark'
                ? 'rgba(167,139,250,0.18)'
                : '#e8e4ff'))
            : theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.06)'
              : 'grey.200',

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',

          visibility: earned ? 'visible' : 'hidden',
        })}
      >
        {badge.icon}
      </Box>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: earned ? 'text.primary' : 'text.disabled',
        }}
      >
        {badge.name}
      </Typography>

      <Typography
        sx={{
          fontSize: '11px',
          color: earned ? (badge.accentColor ?? '#7c6fcd') : 'text.disabled',

          textAlign: 'center',
        }}
      >
        {badge.subtitle}
      </Typography>
    </Paper>
  );
};

interface BadgeGalleryProps {
  badges: BadgeData[];
  earned: number;
  total: number;
  sortValue?: string;
  onSortChange?: (value: string) => void;
}

export const BadgeGallery: React.FC<BadgeGalleryProps> = ({
  badges,
  earned,
  total,
  sortValue = 'recent',
  onSortChange,
}) => {
  const handleChange = (e: SelectChangeEvent) => onSortChange?.(e.target.value);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        borderRadius: '20px',
        p: '28px',
        border: '1px solid',

        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.100',

        bgcolor: 'background.paper',

        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : '0 2px 16px rgba(0,0,0,0.05)',
      })}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Badge Gallery
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            You've earned {earned} of {total} career milestones
          </Typography>
        </Box>

        <Select
          value={sortValue}
          onChange={handleChange}
          size="small"
          IconComponent={KeyboardArrowDownIcon}
          sx={(theme) => ({
            borderRadius: '10px',
            fontSize: '13px',

            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'background.paper',

            '& .MuiOutlinedInput-notchedOutline': {
              borderColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.12)'
                  : 'grey.300',
            },
          })}
        >
          <MenuItem value="recent">Recent Achievement First</MenuItem>

          <MenuItem value="name">Name A–Z</MenuItem>

          <MenuItem value="locked">Locked Last</MenuItem>
        </Select>
      </Box>

      {/* Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px',
        }}
      >
        {badges.map((b) => (
          <Badge key={b.id} badge={b} />
        ))}
      </Box>
    </Paper>
  );
};

export default BadgeGallery;
