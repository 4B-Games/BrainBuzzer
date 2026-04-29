import { useState, useCallback, useEffect, useRef } from 'react'
import { logout, getCurrentUser, getCachedUser } from './services/authService.supabase.js'
import { addEntry } from './services/dataService.supabase.js'
import { supabase } from './services/supabaseClient.js'
import { useTimer } from './hooks/useTimer.js'
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts.js'
import { uid } from './utils/format.js'
import { X } from 'lucide-react'
import LoginView from './views/LoginView.jsx'
import Sidebar from './components/Sidebar.jsx'
import TimerView from './views/TimerView.jsx'
import EntriesView from './views/EntriesView.jsx'
import ReportsView from './views/ReportsView.jsx'
import SettingsView from './views/SettingsView.jsx'
import TeamView from './views/TeamView.jsx'
import ArchivView from './views/ArchivView.jsx'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export default function App() {
  const [theme,          setTheme]          = useState(() => localStorage.getItem('bb_theme') || 'light')
  const [currentUser,    setCurrentUser]    = useState(null)
  const [authLoading,    setAuthLoading]    = useState(true)
  const [page,           setPage]           = useState('timer')
  const [activeEntry,    setActiveEntry]    = useState(null)
  const [timerCtx,       setTimerCtx]       = useState(null)
  const [dataVersion,    setDataVersion]    = useState(0)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)
  const notifRef = useRef(null)

  const { running, elapsed, start, stop, reset } = useTimer()

  // ── Auth: Supabase session handling ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = await getCurrentUser()
        setCurrentUser(user)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('bb_theme', theme)
  }, [theme])

  useEffect(() => {
    if (running && activeEntry) setActiveEntry(prev => prev ? { ...prev, elapsed } : null)
  }, [elapsed, running]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh     = useCallback(() => setDataVersion(v => v + 1), [])
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  // ── Timer ─────────────────────────────────────────────────────
  function handleTimerStart({ companyId, projectId, companyName, companyColor, projectName, projectEmoji, note }) {
    const startISO = start()
    setTimerCtx({ companyId, projectId, note: note ?? '', startISO })
    setActiveEntry({ companyId, companyName, companyColor, projectId, projectName, projectEmoji, elapsed: 0 })

    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    clearTimeout(notifRef.current)
    notifRef.current = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BrainBuzzer – Noch aktiv?', {
          body: `Du arbeitest seit über 2 Stunden an: ${companyName}${projectName ? ' · ' + projectName : ''}`,
          icon: '/favicon.svg', tag: 'bb-reminder',
        })
      }
    }, TWO_HOURS_MS)
  }

  async function handleTimerStop() {
    clearTimeout(notifRef.current)
    if (!timerCtx) return
    const { end, duration } = stop()
    const user = getCachedUser()
    try {
      await addEntry({
        id: uid(), userId: user?.id ?? 'unknown',
        companyId: timerCtx.companyId, projectId: timerCtx.projectId ?? null,
        start: timerCtx.startISO, end, duration, note: timerCtx.note,
      })
    } catch (e) { console.error('addEntry failed', e) }
    setActiveEntry(null); setTimerCtx(null); reset(); refresh()
  }

  function handleLogin(user) { setCurrentUser(user); setPage('timer') }

  async function handleLogout() {
    clearTimeout(notifRef.current)
    if (running) { stop(); reset() }
    await logout()
    setCurrentUser(null); setActiveEntry(null); setTimerCtx(null)
  }

  useKeyboardShortcuts({
    timerRunning: running,
    onStopTimer:  handleTimerStop,
    onNavigate:   setPage,
    onNewEntry:   () => setPage('timer'),
    onShowHelp:   () => setShowShortcutHelp(h => !h),
  })

  if (authLoading) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', color:'var(--text-dim)', fontFamily:'Space Grotesk, sans-serif' }}>
        Verbinde mit Supabase …
      </div>
    )
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} theme={theme} onThemeToggle={toggleTheme} />
  }

  const liveEntry = running && activeEntry && timerCtx
    ? { start: timerCtx.startISO, elapsed: activeEntry.elapsed, color: activeEntry.companyColor, companyId: timerCtx.companyId, projectId: timerCtx.projectId, companyName: activeEntry.companyName, projectEmoji: activeEntry.projectEmoji ?? '', projectName: activeEntry.projectName ?? '' }
    : null

  return (
    <div className="app-shell">
      {showShortcutHelp && (
        <div className="modal-overlay" onClick={() => setShowShortcutHelp(false)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tastenkürzel</h2>
              <button className="modal-close" onClick={() => setShowShortcutHelp(false)}><X size={18}/></button>
            </div>
            <table className="shortcut-table">
              <tbody>{SHORTCUTS.map(s => (<tr key={s.key}><td><kbd className="kbd">{s.key}</kbd></td><td>{s.description}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      <Sidebar page={page} onNavigate={setPage} activeEntry={activeEntry} currentUser={currentUser}
        onLogout={handleLogout} onStopTimer={handleTimerStop} theme={theme} onThemeToggle={toggleTheme} />

      <main className="main-content">
        {page === 'timer' && (
          <TimerView timerRunning={running} timerElapsed={elapsed}
            onTimerStart={handleTimerStart} onTimerStop={handleTimerStop}
            onDataChange={refresh} activeEntry={activeEntry} liveEntry={liveEntry} />
        )}
        {page === 'entries' && <EntriesView dataVersion={dataVersion} onDataChange={refresh} liveEntry={liveEntry} />}
        {page === 'reports' && <ReportsView dataVersion={dataVersion} currentUser={currentUser} />}
        {page === 'team'    && currentUser?.role === 'admin' && <TeamView dataVersion={dataVersion} />}
        {page === 'settings' && <SettingsView onDataChange={refresh} currentUser={currentUser} />}
        {page === 'archiv'   && currentUser?.role === 'admin' && <ArchivView onDataChange={refresh} />}
      </main>
    </div>
  )
}
