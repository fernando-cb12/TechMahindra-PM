import { Button as MuiButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ButtonProps } from '@mui/material';

function Button(props: ButtonProps) {
  const theme = useTheme();

  return (
    <MuiButton
      {...props}
      sx={{
        bgcolor: theme.palette.primary.main,
        fontFamily: theme.typography.fontFamily,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "none",
        fontSize: "0.95rem",
        "&:hover": { bgcolor: theme.palette.primary.dark },
        ...props.sx,
      }}
    />
  );
}

export default Button;