import { Box, AppBar, Toolbar } from "@mui/material";
import mahindraLogo from "../assets/mahindralogobk.png";
import LoginForm from "../components/routes/login/LoginForm";
 
function Login() {
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
 
        {/* Login Form */}
        <LoginForm />
      </Box>
    </Box>
  );
}
 
export default Login;