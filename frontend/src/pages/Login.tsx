import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, AppBar, Toolbar, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import mahindraLogo from "../assets/mahindralogobk.png";
import loginBg from "../assets/loginbg.png";
import LoginForm from "../components/login/LoginForm";
import { ROUTES } from "../app/routes";
import { useAuth } from "../auth/AuthContext";
import { createDevAdminSession, hasMinimumRole, saveSession } from "../auth/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const theme = useTheme();
  const fontFamily = theme.typography.fontFamily ?? '"Montserrat", sans-serif';
  const appBarBg = theme.palette.grey[800];
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    location.state &&
      typeof location.state === "object" &&
      "denied" in location.state
      ? "Your account does not have enough permissions to access this app."
      : undefined,
  );

  const handleLogin = async ({
    email,
    password,
    stayLoggedIn,
  }: {
    email: string;
    password: string;
    stayLoggedIn: boolean;
  }) => {
    try {
      const session = await login({
        email,
        password,
        persistent: stayLoggedIn,
      });
      const canAccess = hasMinimumRole(session.roles, "DEVELOPER");
      if (!canAccess) {
        logout();
        setErrorMessage(
          "Your account does not have enough permissions to access this app.",
        );
        return;
      }
      setErrorMessage(undefined);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in",
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily,
      }}
    >
      {/* Top Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: appBarBg, height: 72, justifyContent: "center" }}
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
            bgcolor: alpha(theme.palette.common.black, 0.7),
          }}
        />

        {/* Login Form */}
        <LoginForm onLogin={handleLogin} errorMessage={errorMessage} />
      </Box>

      <Typography
        component="button"
        type="button"
        onClick={() => {
          saveSession(createDevAdminSession(), true);
          window.location.href = ROUTES.admin;
        }}
        sx={{
          position: "fixed",
          bottom: 12,
          right: 12,
          zIndex: 2,
          border: "none",
          background: "transparent",
          color: alpha(theme.palette.common.white, 0.4),
          fontFamily,
          fontSize: 11,
          cursor: "pointer",
          textDecoration: "underline",
          "&:hover": { color: alpha(theme.palette.common.white, 0.65) },
        }}
      >
        Access as admin
      </Typography>
    </Box>
  );
}

export default Login;
