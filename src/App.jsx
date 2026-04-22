import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TimerView from './views/TimerView.jsx'
import TodayView from './views/TodayView.jsx'
import ReportsView from './views/ReportsView.jsx'
import SettingsView from './views/SettingsView.jsx'

export default function App() {
  const [page, setPage] = useState('timer')
  // activeEntry is set while the timer is running so the banner can show it
  const [activeEntry, setActiveEntry] = useState(null)
  // Increment to force re-render of views that read from dataService
  const [dataVersion, setDataVersion] = useState(0)

  const refresh = useCallback(() => setDataVersion(v => v + 1), [])

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} activeEntry={activeEntry} />
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
        {page === 'reports' && <ReportsView dataVersion={dataVersion} />}
        {page === 'settings' && <SettingsView onDataChange={refresh} />}
      </main>
    </div>
  )
}
