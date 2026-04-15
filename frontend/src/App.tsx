import { useState } from 'react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Issues from './pages/Issues'
import { lightTheme } from './styles/theme'

type AppPage = 'login' | 'dashboard' | 'settings' | 'issues'

function App() {
  const [page, setPage] = useState<AppPage>('login')

  const handleNavItemClick = (value: string) => {
    if (value === 'settings') setPage('settings')
    else if (value === 'dashboard') setPage('dashboard')
    else if (value === 'issues') setPage('issues')
    else setPage('dashboard')
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {page === 'login' ? (
        <Login onLogin={() => setPage('dashboard')} />
      ) : page === 'settings' ? (
        <Settings onNavItemClick={handleNavItemClick} onLogOut={() => setPage('login')} />
      ) : page === 'issues' ? (
        <Issues onNavItemClick={handleNavItemClick} />
      ) : (
        <Dashboard onNavItemClick={handleNavItemClick} />
      )}
    </ThemeProvider>
  )
}

export default App;
