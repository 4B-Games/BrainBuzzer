import { useState, useRef } from 'react'
import { fmtTime } from '../utils/format.js'

const HOUR_START = 7
const HOUR_END = 22
const TOTAL_HOURS = HOUR_END - HOUR_START

function timeToPercent(isoString) {
  const d = new Date(isoString)
  const mins = (d.getHours() - HOUR_START) * 60 + d.getMinutes()
  return Math.max(0, Math.min(100, (mins / (TOTAL_HOURS * 60)) * 100))
}

function durationToPercent(seconds) {
  return Math.min(100, (seconds / (TOTAL_HOURS * 3600)) * 100)
}

function snapMins(pct) {
  const raw = (pct / 100) * TOTAL_HOURS * 60
  return Math.round(raw / 5) * 5  // 5-minute snap for drag precision
}

function minsToDate(minsFromStart, baseDate) {
  const clamped = Math.max(0, Math.min(TOTAL_HOURS * 60, minsFromStart))
  const d = new Date(baseDate)
  d.setHours(HOUR_START + Math.floor(clamped / 60), clamped % 60, 0, 0)
  return d
}

export default function Timeline({ entries, companies, onRangeSelect, date }) {
  const trackRef = useRef(null)
  const [drag, setDrag] = useState(null)

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)
  const baseDate = date ?? new Date()

  function getRelativePct(clientX) {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }

  function handleMouseDown(e) {
    if (!onRangeSelect) return
    if (e.target.closest('.timeline-block')) return
    e.preventDefault()

    const startPct = getRelativePct(e.clientX)
    setDrag({ startPct, currentPct: startPct })

    function onMove(ev) {
      setDrag(prev => prev ? { ...prev, currentPct: getRelativePct(ev.clientX) } : null)
    }

    function onUp(ev) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)

      const endPct = getRelativePct(ev.clientX)
      setDrag(null)

      const minPct = Math.min(startPct, endPct)
      const maxPct = Math.max(startPct, endPct)
      const startMins = snapMins(minPct)
      const endMins   = snapMins(maxPct)

      if (endMins <= startMins) return

      onRangeSelect(
        minsToDate(startMins, baseDate).toISOString(),
        minsToDate(endMins, baseDate).toISOString()
      )
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const minPct = drag ? Math.min(drag.startPct, drag.currentPct) : 0
  const maxPct = drag ? Math.max(drag.startPct, drag.currentPct) : 0
  const dragStartMins = drag ? snapMins(minPct) : 0
  const dragEndMins   = drag ? snapMins(maxPct) : 0

  return (
    <div className="timeline">
      {onRangeSelect && (
        <p className="timeline-hint">Klicken &amp; ziehen um einen Eintrag zu erstellen</p>
      )}
      <div
        className={`timeline-track${onRangeSelect ? ' timeline-track--interactive' : ''}`}
        ref={trackRef}
        onMouseDown={handleMouseDown}
      >
        {hours.map(h => (
          <div
            key={h}
            className="timeline-hour"
            style={{ left: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%` }}
          >
            <span className="timeline-hour-label">{String(h).padStart(2, '0')}:00</span>
            <div className="timeline-hour-tick" />
          </div>
        ))}

        {entries.map(entry => {
          const company = companyMap[entry.companyId]
          const color = company?.color ?? '#6366f1'
          const project = company?.projects?.find(p => p.id === entry.projectId)
          const left  = timeToPercent(entry.start)
          const width = durationToPercent(entry.duration)
          return (
            <div
              key={entry.id}
              className="timeline-block"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.4)}%`, background: color }}
              title={`${fmtTime(entry.start)} – ${fmtTime(entry.end)}\n${company?.name ?? ''}${project ? ' · ' + (project.emoji ?? '') + ' ' + project.name : ''}`}
            >
              {width > 4 && project?.emoji && (
                <span className="timeline-block-emoji">{project.emoji}</span>
              )}
            </div>
          )
        })}

        {drag && (
          <>
            <div
              className="timeline-drag-preview"
              style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 0.2)}%` }}
            />
            {dragEndMins > dragStartMins && (
              <div
                className="timeline-drag-label"
                style={{ left: `${(minPct + maxPct) / 2}%` }}
              >
                {fmtTime(minsToDate(dragStartMins, baseDate))}
                {' – '}
                {fmtTime(minsToDate(dragEndMins, baseDate))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
