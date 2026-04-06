import { type SyntheticEvent, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [stayLoggedIn, setStayLoggedIn] = useState(true)

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log({ email, password, stayLoggedIn })
    alert(`Iniciando sesión con ${email}`)
  }

  return (
    <Box className="login-container">
      <Box className="top-bar">
        <Typography variant="subtitle1" className="brand-text">
          Tech Mahindra
        </Typography>
      </Box>

      <Box className="overlay" />

      <Card className="login-card" elevation={8}>
        <Box className="login-header">
          <Typography variant="h6" component="h1" className="login-title">
            Your Collab X Account
          </Typography>
          <Typography variant="body2" className="login-subtitle">
            Enter your email to log in
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="email-field"
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="password-field"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={stayLoggedIn}
                onChange={(event) => setStayLoggedIn(event.target.checked)}
                color="primary"
              />
            }
            label="Stayed logged in"
            className="checkbox-label"
          />

          <Button
            type="submit"
            variant="contained"
            className="submit-button"
          >
            Continue
          </Button>
        </Box>
      </Card>
    </Box>
  )
}

export default Login
