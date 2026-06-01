import { type SyntheticEvent, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

interface LoginFormProps {
  onLogin: (input: {
    email: string;
    password: string;
    stayLoggedIn: boolean;
  }) => Promise<void>;
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin({ email, password, stayLoggedIn });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fontFamily = '"Montserrat", sans-serif';
  const cardBg = "#2c2c2c";
  const labelColor = "#999";
  const helperColor = "#b8b8b8";
  const inputBg = "#1a1a1a";
  const inputBorder = "#444";
  const inputBorderHover = "#777";
  const inputBorderFocus = "#5F0229";
  const buttonBg = "#5f0229";
  const buttonHover = "#4d0121";
  const checkedColor = "#5F0229";
  const headingColor = "#fff";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: inputBg,
      color: "#fff",
      "& fieldset": { borderColor: inputBorder },
      "&:hover fieldset": { borderColor: inputBorderHover },
      "&.Mui-focused fieldset": { borderColor: inputBorderFocus },
    },
    "& .MuiInputLabel-root": { color: labelColor },
    "& .MuiInputLabel-root.Mui-focused": { color: inputBorderFocus },
  };

  return (
    <Card
      elevation={8}
      sx={{
        width: "100%",
        maxWidth: 420,
        bgcolor: cardBg,
        borderRadius: 2,
        position: "relative",
        zIndex: 1,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h6"
            component="h1"
            sx={{ fontWeight: 700, color: headingColor, fontFamily }}
          >
            Your Collab X Account
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: helperColor, mt: 0.5, fontFamily }}
          >
            Enter your credentials to log in
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 1 }}
        >
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            sx={inputSx}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            sx={inputSx}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                sx={{
                  color: labelColor,
                  "&.Mui-checked": { color: checkedColor },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ color: headingColor, fontFamily }}
              >
                Stay logged in
              </Typography>
            }
            sx={{ mt: 0.5 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{
              mt: 1,
              py: 1.25,
              bgcolor: buttonBg,
              fontFamily,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "none",
              fontSize: "0.95rem",
              "&:hover": { bgcolor: buttonHover },
            }}
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
