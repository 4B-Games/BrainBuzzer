import { Square } from 'lucide-react'
import { fmtDuration } from '../utils/format.js'

export default function TimerBanner({ activeEntry, onStop }) {
  if (!activeEntry) return null

  return (
    <div className="timer-banner" style={{ borderColor: activeEntry.companyColor }}>
      <span className="timer-banner-dot" style={{ background: activeEntry.companyColor }} />
      <div className="timer-banner-info">
        <span className="timer-banner-company">{activeEntry.companyName}</span>
        {activeEntry.projectName && (
          <span className="timer-banner-project">{activeEntry.projectName}</span>
        )}
      </div>
      <span className="timer-banner-elapsed">{fmtDuration(activeEntry.elapsed)}</span>
      <button className="btn-stop" onClick={onStop} title="Timer stoppen">
        <Square size={16} fill="currentColor" />
        Stopp
      </button>
    </div>
  )
}
