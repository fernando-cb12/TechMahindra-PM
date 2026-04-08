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
  AppBar,
  Toolbar,
} from "@mui/material";
import mahindraLogo from "../assets/mahindralogobk.png";
 
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
 
  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log({ email, password, stayLoggedIn });
    alert(`Logging in as ${email}`);
  };
 
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#1a1a1a",
      color: "#fff",
      "& fieldset": { borderColor: "#444" },
      "&:hover fieldset": { borderColor: "#777" },
      "&.Mui-focused fieldset": { borderColor: "#5F0229" },
    },
    "& .MuiInputLabel-root": { color: "#999" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#5F0229" },
  };
 
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: 'url("/src/assets/loginbg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Top Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "#2c2c2c", height: 72, justifyContent: "center" }}
      >
        <Toolbar sx={{ justifyContent: "flex-start" }}>
          <Box
            component="img"
            src={mahindraLogo}
            alt="Tech Mahindra logo"
            sx={{ height: 42, width: "auto" }}
          />
        </Toolbar>
      </AppBar>
 
      {/* Content area with overlay */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          p: 2,
        }}
      >
        {/* Dark overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.70)",
          }}
        />
 
        {/* Login Card */}
        <Card
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 420,
            bgcolor: "#2c2c2c",
            borderRadius: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography
                variant="h6"
                component="h1"
                sx={{ fontWeight: 700, color: "#fff", fontFamily: "inherit" }}
              >
                Your Collab X Account
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#b8b8b8", mt: 0.5, fontFamily: "inherit" }}
              >
                Enter your credentials to log in
              </Typography>
            </Box>
 
            {/* Form */}
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
                      color: "#999",
                      "&.Mui-checked": { color: "#5F0229" },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{ color: "#fff", fontFamily: "inherit" }}
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
                sx={{
                  mt: 1,
                  py: 1.25,
                  bgcolor: "#5f0229",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "none",
                  fontSize: "0.95rem",
                  "&:hover": { bgcolor: "#4d0121" },
                }}
              >
                Continue
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
 
export default Login;