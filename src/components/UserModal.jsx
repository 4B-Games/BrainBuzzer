import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { addUser, updateUser, getUsers } from '../services/authService.supabase.js'

const DEFAULT_COLORS = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
]

export default function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user

  const [name,         setName]         = useState(user?.name         ?? '')
  const [email,        setEmail]        = useState(user?.email        ?? '')
  const [password,     setPassword]     = useState('')
  const [role,         setRole]         = useState(user?.role         ?? 'user')
  const [department,   setDepartment]   = useState(user?.department   ?? '')
  const [weeklyTarget, setWeeklyTarget] = useState(user?.weeklyTarget ?? 0)
  const [color,        setColor]        = useState(user?.color        ?? DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)])
  const [active,       setActive]       = useState(user?.active !== false)
  const [showPw,       setShowPw]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSave() {
    const n = name.trim()
    const e = email.trim().toLowerCase()
    if (!n) { setError('Name ist erforderlich.'); return }
    if (!e || !e.includes('@')) { setError('Gültige E-Mail erforderlich.'); return }
    if (!isEdit && !password) { setError('Passwort ist erforderlich.'); return }

    const dup = getUsers().find(u => u.email.toLowerCase() === e && u.id !== user?.id)
    if (dup) { setError('Diese E-Mail wird bereits verwendet.'); return }

    const data = {
      name: n, email: e, role, department: department.trim(),
      weeklyTarget: parseFloat(weeklyTarget) || 0, color, active,
    }
    if (password) data.password = password

    if (isEdit) await updateUser(user.id, data)
    else        await addUser(data)

    onSaved()
    onClose()
  }

  const initials = name.trim() ? name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide">
        <div className="modal-header">
          <h2>{isEdit ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        {/* Avatar preview */}
        <div className="user-modal-avatar-row">
          <div className="user-modal-avatar" style={{ background: color }}>{initials}</div>
          <div className="user-modal-color-row">
            {DEFAULT_COLORS.map(c => (
              <button key={c} type="button"
                className={`color-swatch${color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <div className="color-picker-wrapper" style={{ marginLeft: 6 }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              <span className="color-preview" style={{ background: color }} />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Vorname Nachname" autoFocus />
          </div>
          <div className="form-group">
            <label>E-Mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@firma.de" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{isEdit ? 'Neues Passwort (leer = unverändert)' : 'Passwort *'}</label>
            <div className="pw-field">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? 'Leer lassen = kein Wechsel' : 'Passwort …'}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Rolle</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Mitarbeiter</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Abteilung / Team</label>
            <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="z.B. Entwicklung, Design …" />
          </div>
          <div className="form-group">
            <label>Wochenziel (Stunden, 0 = kein Ziel)</label>
            <input type="number" min="0" max="80" step="0.5" value={weeklyTarget} onChange={e => setWeeklyTarget(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Konto-Status</label>
          <label className="toggle-label">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className={`toggle-text${active ? '' : ' toggle-text--off'}`}>
              {active ? 'Aktiv – Mitarbeiter kann sich einloggen' : 'Inaktiv – Login gesperrt'}
            </span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave}>
            {isEdit ? 'Änderungen speichern' : 'Mitarbeiter anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
