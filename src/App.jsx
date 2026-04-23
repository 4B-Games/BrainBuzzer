import { useState, useCallback, useEffect } from 'react'
import { getCurrentUser, logout } from './services/authService.js'
import LoginView from './views/LoginView.jsx'
import Sidebar from './components/Sidebar.jsx'
import TimerView from './views/TimerView.jsx'
import TodayView from './views/TodayView.jsx'
import ReportsView from './views/ReportsView.jsx'
import SettingsView from './views/SettingsView.jsx'
import TeamView from './views/TeamView.jsx'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('bb_theme') || 'dark')
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())
  const [page, setPage] = useState('timer')
  const [activeEntry, setActiveEntry] = useState(null)
  const [dataVersion, setDataVersion] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bb_theme', theme)
  }, [theme])

  const refresh = useCallback(() => setDataVersion(v => v + 1), [])
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  function handleLogin(user) {
    setCurrentUser(user)
    setPage('timer')
  }

  function handleLogout() {
    logout()
    setCurrentUser(null)
    setActiveEntry(null)
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} theme={theme} onThemeToggle={toggleTheme} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onNavigate={setPage}
        activeEntry={activeEntry}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <main className="main-content">
        {page === 'timer' && (
          <TimerView
            onEntryStart={setActiveEntry}
            onEntryStop={() => setActiveEntry(null)}
            onDataChange={refresh}
            activeEntry={activeEntry}
          />
        )}
        {page === 'today' && <TodayView dataVersion={dataVersion} onDataChange={refresh} />}
        {page === 'reports' && (
          <ReportsView dataVersion={dataVersion} currentUser={currentUser} />
        )}
        {page === 'team' && currentUser?.role === 'admin' && <TeamView dataVersion={dataVersion} />}
        {page === 'settings' && <SettingsView onDataChange={refresh} currentUser={currentUser} />}
      </main>
    </div>
  )
}
