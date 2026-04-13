import { useState } from 'react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { lightTheme } from './styles/theme'
 
function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'dashboard'>('login')

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {currentPage === 'login' ? (
        <Login onLogin={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard />
      )}
    </ThemeProvider>
  )
}

export default App;
