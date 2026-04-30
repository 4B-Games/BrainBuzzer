import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '../services/authService.supabase.js'

export default function ChangePasswordModal({ onClose }) {
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleSave() {
    setError('')
    if (newPw.length < 6)        { setError('Passwort muss mindestens 6 Zeichen lang sein.'); return }
    if (newPw !== confirmPw)      { setError('Die Passwörter stimmen nicht überein.'); return }

    setLoading(true)
    try {
      await changePassword(newPw)
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e.message ?? 'Fehler beim Ändern des Passworts.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>Passwort ändern</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {success ? (
          <p style={{ color: 'var(--success)', fontSize: 14 }}>✓ Passwort erfolgreich geändert.</p>
        ) : (
          <>
            {error && <p className="modal-error">{error}</p>}

            <div className="form-group">
              <label>Neues Passwort</label>
              <div className="pw-field">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  autoFocus
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Passwort bestätigen</label>
              <div className="pw-field">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Passwort wiederholen"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? 'Speichern …' : 'Passwort ändern'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
