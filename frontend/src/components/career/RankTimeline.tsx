import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';

export type RankStep = {
  id: string;
  label: string;
  pointsRequired?: number;
  isCurrent?: boolean;
  isUnlocked?: boolean;
  icon?: React.ReactNode;
};

interface RankTimelineProps {
  rankProgress: number;
  currentXP: number;
  maxXP: number;
  steps: RankStep[];
}

const RankTimeline: React.FC<RankTimelineProps> = ({
  rankProgress,
  currentXP,
  maxXP,
  steps,
}) => {
  return (
    <Paper
      sx={(theme) => ({
        borderRadius: '5px',
        p: '28px 32px 32px',
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark' ? alpha(theme.palette.grey[50], 0.08) : 'grey.100',
        bgcolor: 'background.paper',
      })}
    >
      {/* Top row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ letterSpacing: '-1px' }}
          >
            {rankProgress}
            <Box
              component="span"
              sx={{ fontSize: '18px', color: 'text.secondary' }}
            >
              %
            </Box>
          </Typography>

          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
          </Typography>
        </Box>
      </Box>

      {/* XP Progress */}
      <Box mb={4}>
        <LinearProgress
          variant="determinate"
          value={(currentXP / maxXP) * 100}
          sx={(theme) => ({
            height: 10,
            borderRadius: 5,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.grey[50], 0.08)
                : 'grey.100',

            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.light} 50%, ${theme.palette.primary.main} 100%)`,
            },
          })}
        />
      </Box>

      {/* Rank Steps */}
      <Box sx={{ display: 'flex', position: 'relative' }}>
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: '24px',
            left: '24px',
            right: '24px',
            height: '2px',

            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.grey[50], 0.08)
                : 'grey.100',

            zIndex: 0,
          })}
        />

        {steps.map((step) => {
          const unlocked = step.isUnlocked || step.isCurrent;

          return (
            <Box
              key={step.id}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                zIndex: 1,
              }}
            >
              <Box
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',

                  bgcolor: step.isCurrent
                    ? 'transparent'
                    : unlocked
                      ? theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.light, 0.16)
                        : alpha(theme.palette.primary.light, 0.12)
                      : theme.palette.mode === 'dark'
                        ? alpha(theme.palette.grey[50], 0.04)
                        : 'grey.100',

                  background: step.isCurrent
                    ? `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
                    : undefined,

                  border: '2px solid',

                  borderColor: step.isCurrent
                    ? 'primary.main'
                    : unlocked
                      ? theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.light, 0.4)
                        : alpha(theme.palette.primary.light, 0.5)
                      : theme.palette.mode === 'dark'
                        ? alpha(theme.palette.grey[50], 0.08)
                        : 'grey.200',

                  color: step.isCurrent
                    ? 'primary.contrastText'
                    : unlocked
                      ? 'primary.main'
                      : 'text.disabled',
                  filter: !unlocked ? 'grayscale(1) opacity(0.5)' : 'none',

                  '& .MuiSvgIcon-root': {
                    fontSize: '22px',
                  },
                })}
              >
                {step.icon ?? <StarIcon />}
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: step.isCurrent ? 700 : 500,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: step.isCurrent
                      ? 'primary.main'
                      : unlocked
                        ? 'text.primary'
                        : 'text.disabled',
                  }}
                >
                  {step.label}
                </Typography>

                {step.pointsRequired && !step.isCurrent && (
                  <Typography
                    sx={{
                      fontSize: '11px',
                      color: 'text.disabled',
                    }}
                  >
                    {step.pointsRequired.toLocaleString()} pts
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default RankTimeline;
