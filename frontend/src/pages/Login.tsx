import { useNavigate } from "react-router-dom";
import { Box, AppBar, Toolbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import mahindraLogo from "../assets/mahindralogobk.png";
import loginBg from "../assets/loginbg.png";
import LoginForm from "../components/routes/login/LoginForm";
import { ROUTES } from "../app/routes";

function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const fontFamily = theme.typography.fontFamily ?? '"Montserrat", sans-serif';
  const appBarBg = "#2c2c2c";

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
            bgcolor: "rgba(0,0,0,0.70)",
          }}
        />

        {/* Login Form */}
        <LoginForm onLogin={() => navigate(ROUTES.dashboard)} />
      </Box>
    </Box>
  );
}

export default Login;
