import Button from '@mui/material/Button';
import BoltIcon from '@mui/icons-material/Bolt';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes';

interface GoToRewardButtonProps {
  points?: number;
}

export default function GoToRewardButton({ points }: GoToRewardButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(ROUTES.rewards)}
      startIcon={<BoltIcon sx={{ fontSize: '15px !important' }} />}
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.01em',
        borderRadius: '20px',
        px: 2,
        py: 0.75,
        gap: 0.5,
        textTransform: 'none',
        boxShadow: 'none',
        transition: 'background 0.15s, box-shadow 0.15s',
        '&:hover': {
          bgcolor: 'primary.dark',
          boxShadow: '0 2px 8px rgba(95,2,41,0.25)',
        },
      }}
    >
      Rewards
      {points !== undefined && (
        <span
          style={{
            marginLeft: 6,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 12,
            padding: '1px 8px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.01em',
          }}
        >
          {points.toLocaleString()} pts
        </span>
      )}
    </Button>
  );
}
