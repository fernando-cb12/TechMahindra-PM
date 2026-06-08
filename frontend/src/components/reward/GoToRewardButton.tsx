import Button from '@mui/material/Button';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes';

interface GoToRewardButtonProps {
  points?: number;
  destination?: 'rewards' | 'career';
}

export default function GoToRewardButton({ points, destination = 'rewards' }: GoToRewardButtonProps) {
  const navigate = useNavigate();
  const isCareerDestination = destination === 'career';

  return (
    <Button
      variant="contained"
      onClick={() => navigate(isCareerDestination ? ROUTES.career : ROUTES.rewards)}
      startIcon={isCareerDestination
        ? <EmojiEventsOutlinedIcon sx={{ fontSize: '15px !important' }} />
        : <BoltIcon sx={{ fontSize: '15px !important' }} />}
      sx={{
        fontSize: 13,
        letterSpacing: '0.01em',
        px: 2,
        py: 0.75,
      }}
    >
      {isCareerDestination ? 'Career' : 'Rewards'}
      {!isCareerDestination && points !== undefined && (
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
