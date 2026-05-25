// Badge.tsx

import React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { SelectChangeEvent } from '@mui/material';
import type { Palette } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';

export type BadgeStatus = 'earned' | 'locked';
type BadgeAccent = 'primary' | 'info' | 'warning' | 'error' | 'success';

export type BadgeData = {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  status: BadgeStatus;
  color?: BadgeAccent;
  accentColor?: BadgeAccent;
  description?: string;
  earnedDate?: string;
};

const getAccentColor = (palette: Palette, color: BadgeAccent = 'primary') =>
  palette[color].main;

interface BadgeProps {
  badge: BadgeData;
}

export const Badge: React.FC<BadgeProps> = ({ badge }) => {
  const earned = badge.status === 'earned';
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Paper
        elevation={earned ? 1 : 0}
        onClick={handleOpen}
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          p: '20px 16px',
          borderRadius: '16px',
          border: '1px solid',

          borderColor:
            theme.palette.mode === 'dark' ? alpha(theme.palette.grey[50], 0.08) : 'grey.200',

          bgcolor: earned
            ? 'background.paper'
            : theme.palette.mode === 'dark'
              ? alpha(theme.palette.grey[50], 0.03)
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
                    ? `0 8px 24px ${alpha(theme.palette.grey[900], 0.45)}`
                    : `0 8px 24px ${alpha(theme.palette.grey[900], 0.12)}`,
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
              ? alpha(getAccentColor(theme.palette, badge.color), theme.palette.mode === 'dark' ? 0.22 : 0.14)
              : theme.palette.mode === 'dark'
                ? alpha(theme.palette.grey[50], 0.06)
                : 'grey.200',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            color: earned ? getAccentColor(theme.palette, badge.accentColor ?? badge.color) : 'text.disabled',

            visibility: earned ? 'visible' : 'hidden',

            '& .MuiSvgIcon-root': {
              fontSize: '26px',
            },
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
          sx={(theme) => ({
            fontSize: '11px',
            color: earned ? getAccentColor(theme.palette, badge.accentColor) : 'text.disabled',

            textAlign: 'center',
          })}
        >
          {badge.subtitle}
        </Typography>
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: (theme) => ({
            borderRadius: '16px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? alpha(theme.palette.grey[50], 0.08) : 'grey.100',
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 12px 36px ${alpha(theme.palette.grey[900], 0.45)}`
                : `0 12px 36px ${alpha(theme.palette.grey[900], 0.12)}`,
          }),
        }}
      >
        <IconButton
          aria-label="Close achievement details"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <DialogContent
          sx={{
            p: '28px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            textAlign: 'center',
          }}
        >
          <Box
            sx={(theme) => ({
              width: 60,
              height: 60,
              borderRadius: '16px',
              bgcolor: alpha(getAccentColor(theme.palette, badge.color), theme.palette.mode === 'dark' ? 0.22 : 0.14),
              color: getAccentColor(theme.palette, badge.accentColor ?? badge.color),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              '& .MuiSvgIcon-root': {
                fontSize: '30px',
              },
            })}
          >
            {badge.icon}
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'text.primary',
              }}
            >
              {badge.name}
            </Typography>

            <Typography
              sx={(theme) => ({
                mt: 0.5,
                fontSize: '13px',
                color: getAccentColor(theme.palette, badge.accentColor),
              })}
            >
              {badge.subtitle}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: '13px',
              color: 'text.secondary',
            }}
          >
            {badge.description ?? badge.subtitle}
          </Typography>

          <Typography
            sx={{
              fontSize: '12px',
              color: 'text.disabled',
            }}
          >
            Earned {badge.earnedDate ?? 'date unavailable'}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
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
          theme.palette.mode === 'dark' ? alpha(theme.palette.grey[50], 0.08) : 'grey.100',

        bgcolor: 'background.paper',

        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 4px 20px ${alpha(theme.palette.grey[900], 0.35)}`
            : `0 2px 16px ${alpha(theme.palette.grey[900], 0.05)}`,
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
                ? alpha(theme.palette.grey[50], 0.03)
                : 'background.paper',

            '& .MuiOutlinedInput-notchedOutline': {
              borderColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.grey[50], 0.12)
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
