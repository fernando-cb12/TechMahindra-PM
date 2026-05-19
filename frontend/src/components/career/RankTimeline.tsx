import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

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
        borderRadius: '20px',
        p: '28px 32px 32px',
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'grey.100',
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
            borderRadius: 99,
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'grey.100',

            '& .MuiLinearProgress-bar': {
              borderRadius: 99,
              background:
                'linear-gradient(90deg, #6ec6ff 0%, #a78bfa 50%, #7c3aed 100%)',
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
                ? 'rgba(255,255,255,0.08)'
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
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',

                  bgcolor: step.isCurrent
                    ? 'transparent'
                    : unlocked
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(167,139,250,0.12)'
                        : '#f5f0ff'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'grey.100',

                  background: step.isCurrent
                    ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                    : undefined,

                  border: '2px solid',

                  borderColor: step.isCurrent
                    ? '#7c3aed'
                    : unlocked
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(196,181,253,0.4)'
                        : '#c4b5fd'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'grey.200',

                  filter: !unlocked ? 'grayscale(1) opacity(0.5)' : 'none',
                })}
              >
                {step.icon ?? '⭐'}
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: step.isCurrent ? 700 : 500,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: step.isCurrent
                      ? '#7c3aed'
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
