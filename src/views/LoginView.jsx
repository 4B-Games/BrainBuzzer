import { useState } from 'react'
import { Clock, Sun, Moon, LogIn } from 'lucide-react'
import { login } from '../services/authService.js'

export default function LoginView({ onLogin, theme, onThemeToggle }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const user = login(email, password)
    if (!user) {
      setError('E-Mail oder Passwort falsch.')
      return
    }
    onLogin(user)
  }

  return (
    <div className="login-page">
      <button className="login-theme-btn" onClick={onThemeToggle} title="Design wechseln">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="login-card">
        <div className="login-logo">
          <Clock size={30} />
          <span>Brain<strong>Buzzer</strong></span>
        </div>

        <p className="login-subtitle">Zeiterfassung für dein Team</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@firma.de"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary login-submit-btn">
            <LogIn size={16} />
            Anmelden
          </button>
        </form>

        <div className="login-demo-hint">
          <p className="login-demo-title">Demo-Zugänge</p>
          <div className="login-demo-row">
            <span>Admin</span>
            <code>admin@brainbuzzer.de&nbsp;/&nbsp;admin123</code>
          </div>
          <div className="login-demo-row">
            <span>Mitarbeiter</span>
            <code>anna@brainbuzzer.de&nbsp;/&nbsp;pass123</code>
          </div>
        </div>
      </div>
    </div>
  )
}
