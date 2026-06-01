import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

export default function TaskPill({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 24,
        borderRadius: 1.5,
        bgcolor: alpha(color, 0.12),
        color,
        fontSize: 11,
        fontWeight: 800,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
