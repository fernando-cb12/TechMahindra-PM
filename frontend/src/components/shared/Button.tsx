import { Button as MuiButton } from '@mui/material';
import type { ButtonProps } from '@mui/material';

function Button(props: ButtonProps) {
  return (
    <MuiButton
      {...props}
      sx={{
        bgcolor: "#5f0229",
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "none",
        fontSize: "0.95rem",
        "&:hover": { bgcolor: "#4d0121" },
        ...props.sx,
      }}
    />
  );
}

export default Button;