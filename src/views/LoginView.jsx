import { useState } from 'react'
import { Clock, Sun, Moon, LogIn } from 'lucide-react'
import { login } from '../services/authService.supabase.js'
import SidebarParticles from '../components/SidebarParticles.jsx'

export default function LoginView({ onLogin, theme, onThemeToggle }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      if (!user)               { setError('E-Mail oder Passwort falsch.'); return }
      if (user === 'disabled') { setError('Dieses Konto wurde deaktiviert. Bitte Admin kontaktieren.'); return }
      onLogin(user)
    } catch (err) {
      setError('Verbindungsfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Particles fill the entire dark background */}
      <SidebarParticles />

      <button className="login-theme-btn" onClick={onThemeToggle} title="Design wechseln"
        style={{ zIndex: 2 }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="login-card" style={{ position: 'relative', zIndex: 2 }}>
        <div className="login-logo">
          <Clock size={30} />
          <span>Brain<strong>Buzzer</strong></span>
        </div>
        <p className="login-subtitle">Zeiterfassung für dein Team</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de" autoFocus required />
          </div>
          <div className="form-group">
            <label>Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
            <LogIn size={16} />
            {loading ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
