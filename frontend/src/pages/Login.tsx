import { Box, AppBar, Toolbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import mahindraLogo from "../assets/mahindralogobk.png";
import LoginForm from "../components/routes/login/LoginForm";
 
interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const theme = useTheme();
  const fontFamily = theme.typography.fontFamily ?? '"Montserrat", sans-serif';
  const appBarBg = "#2c2c2c";

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
        <LoginForm onLogin={onLogin} />
      </Box>
    </Box>
  );
}
 
export default Login;