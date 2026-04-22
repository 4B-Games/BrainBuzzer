import { Timer, Calendar, BarChart2, Settings, Clock } from 'lucide-react'
import { fmtDuration } from '../utils/format.js'

const NAV = [
  { id: 'timer', label: 'Timer', Icon: Timer },
  { id: 'today', label: 'Heute', Icon: Calendar },
  { id: 'reports', label: 'Berichte', Icon: BarChart2 },
  { id: 'settings', label: 'Einstellungen', Icon: Settings },
]

export default function Sidebar({ page, onNavigate, activeEntry }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Clock size={22} />
        <span>Brain<strong>Buzzer</strong></span>
      </div>

      {activeEntry && (
        <div className="sidebar-timer-badge" style={{ borderColor: activeEntry.companyColor }}>
          <span className="sidebar-timer-dot" style={{ background: activeEntry.companyColor }} />
          <span className="sidebar-timer-label">{activeEntry.companyName}</span>
          <span className="sidebar-timer-elapsed">{fmtDuration(activeEntry.elapsed)}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item${page === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
