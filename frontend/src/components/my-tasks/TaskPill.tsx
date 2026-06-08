import { Chip } from '@mui/material';
import { alpha, lighten, useTheme } from '@mui/material/styles';

export default function TaskPill({ label, color }: { label: string; color: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const readableColor = isDark ? lighten(color, 0.18) : color;

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 24,
        bgcolor: isDark ? alpha(readableColor, 0.22) : alpha(color, 0.12),
        color: isDark ? readableColor : color,
        border: '1px solid',
        borderColor: isDark ? alpha(readableColor, 0.32) : 'transparent',
        fontWeight: 800,
      }}
    />
  );
}
