import { Button, type ButtonProps } from '@mui/material';
import { alpha } from '@mui/material/styles';

function WorkspaceActionPillButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      {...props}
      sx={[
        (theme) => ({
          minHeight: 30,
          px: 1.5,
          borderRadius: 999,
          textTransform: 'none',
          fontFamily: theme.typography.fontFamily,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.2,
          color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.55 : 0.35),
          bgcolor: 'transparent',
          '& .MuiButton-startIcon': {
            mr: 0.6,
            '& > *:nth-of-type(1)': { fontSize: 17 },
          },
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
          '&.Mui-disabled': {
            borderColor: alpha(theme.palette.text.disabled, 0.28),
          },
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}

export default WorkspaceActionPillButton;
