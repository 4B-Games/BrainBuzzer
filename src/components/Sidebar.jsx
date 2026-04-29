import { Timer, List, BarChart2, Settings, Clock, LogOut, Sun, Moon, Users, Square, Archive } from 'lucide-react'
import { fmtDuration } from '../utils/format.js'
import SidebarParticles from './SidebarParticles.jsx'

export default function Sidebar({ page, onNavigate, activeEntry, currentUser, onLogout, onStopTimer, theme, onThemeToggle }) {
  const isAdmin = currentUser?.role === 'admin'

  const NAV = [
    { id: 'timer',    label: 'Timer',           Icon: Timer },
    { id: 'entries',  label: 'Einträge',        Icon: List },
    { id: 'reports',  label: 'Berichte',        Icon: BarChart2 },
    ...(isAdmin ? [{ id: 'team',   label: 'Team',   Icon: Users }] : []),
    { id: 'settings', label: 'Einstellungen',   Icon: Settings },
    ...(isAdmin ? [{ id: 'archiv', label: 'Archiv', Icon: Archive }] : []),
  ]

  return (
    <aside className="sidebar" style={{ position: 'relative' }}>
      {/* Floating particle animation */}
      <SidebarParticles />

      <div className="sidebar-logo" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sidebar-logo-icon"><Clock size={36} /></div>
        <div>
          <div className="sidebar-logo-name">Brain<strong>Buzzer</strong></div>
          <div className="sidebar-logo-tag">Zeiterfassung</div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ position: 'relative', zIndex: 1 }}>
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

      {activeEntry && (
        <div className="sat-banner" style={{ borderColor: activeEntry.companyColor, position: 'relative', zIndex: 1 }}>
          <div className="sat-body" onClick={() => onNavigate('timer')} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onNavigate('timer')}>
            <span className="sat-dot" style={{ background: activeEntry.companyColor }} />
            <div className="sat-info">
              <span className="sat-company">{activeEntry.companyName}</span>
              {(activeEntry.projectName || activeEntry.projectEmoji) && (
                <span className="sat-project">
                  {activeEntry.projectEmoji ? activeEntry.projectEmoji + ' ' : ''}
                  {activeEntry.projectName}
                </span>
              )}
              <span className="sat-elapsed">{fmtDuration(activeEntry.elapsed)}</span>
            </div>
            <span className="sat-nav-hint">→ Timer</span>
          </div>
          <button className="sat-stop-btn" onClick={onStopTimer}>
            <Square size={13} fill="currentColor" />
            Timer stoppen
          </button>
        </div>
      )}

      <div className="sidebar-bottom" style={{ position: 'relative', zIndex: 1 }}>
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
