import { useState, useEffect } from 'react'
import { PlusCircle, Pencil, Trash2, UserCheck, UserX, KeyRound } from 'lucide-react'
import { getUsers, updateUser, deleteUser, getCurrentUser } from '../services/authService.js'
import { getAllEntries } from '../services/dataService.js'
import { fmtDate, fmtDurationShort } from '../utils/format.js'
import UserModal from './UserModal.jsx'

function Badge({ role, active }) {
  if (active === false) return <span className="badge badge--off">Inaktiv</span>
  if (role === 'admin')  return <span className="badge badge--admin">Admin</span>
  return <span className="badge badge--user">Mitarbeiter</span>
}

function Avatar({ user }) {
  const initials = user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const bg = user.color ?? '#6366f1'
  const opacity = user.active === false ? 0.4 : 1
  return (
    <span className="mgmt-avatar" style={{ background: bg, opacity }}>
      {initials}
    </span>
  )
}

export default function TeamManagement({ dataVersion }) {
  const [users,          setUsers]          = useState([])
  const [allEntries,     setAllEntries]     = useState([])
  const [showModal,      setShowModal]      = useState(false)
  const [editingUser,    setEditingUser]    = useState(null)
  const [confirmDelete,  setConfirmDelete]  = useState(null)
  const [resetPwUser,    setResetPwUser]    = useState(null)
  const [newPw,          setNewPw]          = useState('')
  const [pwMsg,          setPwMsg]          = useState('')
  const me = getCurrentUser()

  function refresh() {
    setUsers(getUsers())
    setAllEntries(getAllEntries())
  }

  useEffect(() => { refresh() }, [dataVersion])

  function handleDelete(id) {
    deleteUser(id)
    refresh()
    setConfirmDelete(null)
  }

  function handleToggleActive(user) {
    updateUser(user.id, { active: user.active === false ? true : false })
    refresh()
  }

  function handleResetPw() {
    if (!newPw.trim()) { setPwMsg('Passwort darf nicht leer sein.'); return }
    updateUser(resetPwUser.id, { password: newPw.trim() })
    setResetPwUser(null)
    setNewPw('')
    setPwMsg('')
  }

  // Stats per user
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  function monthHours(userId) {
    return allEntries
      .filter(e => e.userId === userId && new Date(e.start) >= monthStart)
      .reduce((s, e) => s + e.duration, 0)
  }
  function lastActivity(userId) {
    const dates = allEntries.filter(e => e.userId === userId).map(e => new Date(e.start))
    return dates.length ? new Date(Math.max(...dates)) : null
  }

  const admins    = users.filter(u => u.role === 'admin')
  const employees = users.filter(u => u.role !== 'admin')
  const inactive  = users.filter(u => u.active === false)

  return (
    <div>
      {/* Summary bar */}
      <div className="mgmt-summary">
        <span><strong>{users.length}</strong> Konten gesamt</span>
        <span><strong>{admins.length}</strong> Admin{admins.length !== 1 ? 's' : ''}</span>
        <span><strong>{employees.length}</strong> Mitarbeiter</span>
        {inactive.length > 0 && <span className="mgmt-inactive-count"><strong>{inactive.length}</strong> inaktiv</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => { setEditingUser(null); setShowModal(true) }}>
          <PlusCircle size={16} /> Neuer Mitarbeiter
        </button>
      </div>

      {/* User table */}
      <div className="mgmt-table-wrap">
        <table className="mgmt-table">
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>E-Mail</th>
              <th>Abteilung</th>
              <th>Status</th>
              <th>Ø Wochenziel</th>
              <th>Diesen Monat</th>
              <th>Zuletzt aktiv</th>
              <th style={{ width: 120 }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const mh   = monthHours(u.id)
              const last = lastActivity(u.id)
              const isSelf = u.id === me?.id
              return (
                <tr key={u.id} className={u.active === false ? 'mgmt-row--inactive' : ''}>
                  <td>
                    <div className="mgmt-name-cell">
                      <Avatar user={u} />
                      <div>
                        <div className="mgmt-name">{u.name}</div>
                        {u.role === 'admin' && <div className="mgmt-role-hint">Administrator</div>}
                      </div>
                    </div>
                  </td>
                  <td className="mgmt-email">{u.email}</td>
                  <td>{u.department || <span className="dim">—</span>}</td>
                  <td><Badge role={u.role} active={u.active} /></td>
                  <td>
                    {u.weeklyTarget > 0
                      ? <span>{u.weeklyTarget}h / Woche</span>
                      : <span className="dim">Kein Ziel</span>}
                  </td>
                  <td>
                    <strong>{fmtDurationShort(mh)}</strong>
                    {u.weeklyTarget > 0 && mh > 0 && (
                      <span className="mgmt-target-pct">
                        {' '}({Math.round((mh / 3600 / (u.weeklyTarget * 4)) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td>{last ? fmtDate(last) : <span className="dim">Noch nie</span>}</td>
                  <td>
                    <div className="mgmt-actions">
                      {/* Edit */}
                      <button className="mgmt-btn" title="Bearbeiten"
                        onClick={() => { setEditingUser(u); setShowModal(true) }}>
                        <Pencil size={14} />
                      </button>

                      {/* Reset password */}
                      <button className="mgmt-btn" title="Passwort zurücksetzen"
                        onClick={() => { setResetPwUser(u); setNewPw(''); setPwMsg('') }}>
                        <KeyRound size={14} />
                      </button>

                      {/* Toggle active (not yourself) */}
                      {!isSelf && (
                        <button
                          className={`mgmt-btn${u.active === false ? ' mgmt-btn--activate' : ' mgmt-btn--deactivate'}`}
                          title={u.active === false ? 'Aktivieren' : 'Deaktivieren'}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.active === false ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      )}

                      {/* Delete (not yourself, with confirmation) */}
                      {!isSelf && (
                        confirmDelete === u.id ? (
                          <>
                            <button className="mgmt-btn mgmt-btn--danger" onClick={() => handleDelete(u.id)}>Ja</button>
                            <button className="mgmt-btn" onClick={() => setConfirmDelete(null)}>Nein</button>
                          </>
                        ) : (
                          <button className="mgmt-btn mgmt-btn--danger-soft" title="Löschen"
                            onClick={() => setConfirmDelete(u.id)}>
                            <Trash2 size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* User add/edit modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null) }}
          onSaved={refresh}
        />
      )}

      {/* Quick password reset modal */}
      {resetPwUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setResetPwUser(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Passwort zurücksetzen</h2>
              <button className="modal-close" onClick={() => setResetPwUser(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
              Neues Passwort für <strong>{resetPwUser.name}</strong>:
            </p>
            {pwMsg && <p className="modal-error">{pwMsg}</p>}
            <div className="form-group">
              <label>Neues Passwort</label>
              <input type="text" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Neues Passwort …" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleResetPw()} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setResetPwUser(null)}>Abbrechen</button>
              <button className="btn-primary" onClick={handleResetPw}>Passwort setzen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
