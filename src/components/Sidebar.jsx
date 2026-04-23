import { Timer, Calendar, BarChart2, Settings, Clock, LogOut, Sun, Moon, Users } from 'lucide-react'
import { fmtDuration } from '../utils/format.js'

export default function Sidebar({ page, onNavigate, activeEntry, currentUser, onLogout, theme, onThemeToggle }) {
  const isAdmin = currentUser?.role === 'admin'

  const NAV = [
    { id: 'timer',    label: 'Timer',          Icon: Timer },
    { id: 'today',    label: 'Heute',          Icon: Calendar },
    { id: 'reports',  label: 'Berichte',       Icon: BarChart2 },
    ...(isAdmin ? [{ id: 'team', label: 'Team', Icon: Users }] : []),
    { id: 'settings', label: 'Einstellungen',  Icon: Settings },
  ]

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

      <div className="sidebar-bottom">
        <button className="sidebar-theme-btn" onClick={onThemeToggle} title="Design wechseln">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}</span>
        </button>

        {currentUser && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser.name}</span>
              <span className="sidebar-user-role">
                {currentUser.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
              </span>
            </div>
            <button className="sidebar-logout-btn" onClick={onLogout} title="Abmelden">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
