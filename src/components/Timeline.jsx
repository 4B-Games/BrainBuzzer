import { useState, useRef } from 'react'
import { fmtTime, fmtDurationShort } from '../utils/format.js'

const HOUR_START  = 6
const HOUR_END    = 23
const TOTAL_HOURS = HOUR_END - HOUR_START  // 17

// ── Conversion helpers ───────────────────────────────────────────

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
  return Math.round(raw / 5) * 5
}

function minsToDate(minsFromStart, baseDate) {
  const clamped = Math.max(0, Math.min(TOTAL_HOURS * 60, minsFromStart))
  const d = new Date(baseDate)
  d.setHours(HOUR_START + Math.floor(clamped / 60), clamped % 60, 0, 0)
  return d
}

function minsToTime(minsFromStart) {
  const clamped = Math.max(0, Math.min(TOTAL_HOURS * 60, minsFromStart))
  const h = HOUR_START + Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// ── Generate tick marks ──────────────────────────────────────────

const TICKS = (() => {
  const ticks = []
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    const mins = (h - HOUR_START) * 60
    ticks.push({ mins, isHour: true, label: `${String(h).padStart(2,'0')}:00` })
    if (h < HOUR_END) {
      ticks.push({ mins: mins + 30, isHour: false, label: null })
    }
  }
  return ticks
})()

// ── Component ────────────────────────────────────────────────────

export default function Timeline({ entries, companies, onRangeSelect, onBlockMove, date }) {
  const trackRef    = useRef(null)
  const movingRef   = useRef(null)
  const [dragRange,   setDragRange]   = useState(null)   // create-by-drag state
  const [movingBlock, setMovingBlock] = useState(null)   // move-existing-block state

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
  const baseDate   = date ?? new Date()

  function getRelativePct(clientX) {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }

  // ── Drag to create new entry (on empty track) ─────────────────

  function handleTrackMouseDown(e) {
    if (!onRangeSelect) return
    if (e.target.closest('.tl-block')) return   // handled by block handler
    e.preventDefault()

    const startPct = getRelativePct(e.clientX)
    setDragRange({ startPct, currentPct: startPct })

    function onMove(ev) {
      setDragRange(prev => prev ? { ...prev, currentPct: getRelativePct(ev.clientX) } : null)
    }

    function onUp(ev) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const endPct = getRelativePct(ev.clientX)
      setDragRange(null)

      const startMins = snapMins(Math.min(startPct, endPct))
      const endMins   = snapMins(Math.max(startPct, endPct))
      if (endMins <= startMins) return

      onRangeSelect({
        start: minsToDate(startMins, baseDate).toISOString(),
        end:   minsToDate(endMins,   baseDate).toISOString(),
      })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Drag to move existing block ───────────────────────────────

  function handleBlockMouseDown(e, entry) {
    if (!onBlockMove) return
    e.preventDefault()
    e.stopPropagation()

    const trackWidth  = trackRef.current.getBoundingClientRect().width
    const startD      = new Date(entry.start)
    const origStartMins = (startD.getHours() - HOUR_START) * 60 + startD.getMinutes()
    const durationMins  = Math.round(entry.duration / 60)

    const mb = { entryId: entry.id, origStartMins, durationMins, deltaX: 0, startX: e.clientX, trackWidth }
    movingRef.current = mb
    setMovingBlock({ ...mb })

    function onMove(ev) {
      const updated = { ...movingRef.current, deltaX: ev.clientX - movingRef.current.startX }
      movingRef.current = updated
      setMovingBlock({ ...updated })
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const mb = movingRef.current
      if (mb) {
        const deltaMinutes  = Math.round((mb.deltaX / mb.trackWidth) * TOTAL_HOURS * 60 / 5) * 5
        const newStartMins  = Math.max(0, Math.min(TOTAL_HOURS * 60 - mb.durationMins, mb.origStartMins + deltaMinutes))
        const newEndMins    = newStartMins + mb.durationMins
        onBlockMove(
          mb.entryId,
          minsToDate(newStartMins, baseDate).toISOString(),
          minsToDate(newEndMins,   baseDate).toISOString()
        )
      }
      movingRef.current = null
      setMovingBlock(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Compute moved block position ──────────────────────────────

  function getMovedPosition(entry) {
    if (!movingBlock || movingBlock.entryId !== entry.id) return null
    const deltaMinutes = Math.round((movingBlock.deltaX / movingBlock.trackWidth) * TOTAL_HOURS * 60 / 5) * 5
    const newStartMins = Math.max(0, Math.min(TOTAL_HOURS * 60 - movingBlock.durationMins, movingBlock.origStartMins + deltaMinutes))
    const newEndMins   = newStartMins + movingBlock.durationMins
    return {
      leftPct:   (newStartMins / (TOTAL_HOURS * 60)) * 100,
      widthPct:  (movingBlock.durationMins / (TOTAL_HOURS * 60)) * 100,
      startTime: minsToTime(newStartMins),
      endTime:   minsToTime(newEndMins),
    }
  }

  // ── Drag range preview calculation ───────────────────────────

  const drMinPct  = dragRange ? Math.min(dragRange.startPct, dragRange.currentPct) : 0
  const drMaxPct  = dragRange ? Math.max(dragRange.startPct, dragRange.currentPct) : 0
  const drStartM  = dragRange ? snapMins(drMinPct) : 0
  const drEndM    = dragRange ? snapMins(drMaxPct) : 0

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="timeline">
      {onRangeSelect && (
        <p className="timeline-hint">Klicken &amp; ziehen auf freie Fläche → Eintrag erstellen &nbsp;·&nbsp; Block ziehen → Zeit verschieben</p>
      )}

      <div
        className={`timeline-track${onRangeSelect ? ' timeline-track--interactive' : ''}`}
        ref={trackRef}
        onMouseDown={handleTrackMouseDown}
      >
        {/* ── Tick marks ── */}
        {TICKS.map(({ mins, isHour, label }) => {
          const pct = (mins / (TOTAL_HOURS * 60)) * 100
          return (
            <div
              key={mins}
              className={`tl-tick${isHour ? '' : ' tl-tick--half'}`}
              style={{ left: `${pct}%` }}
            >
              {label && <span className="tl-tick-label">{label}</span>}
              <div className="tl-tick-line" />
            </div>
          )
        })}

        {/* ── Entry blocks ── */}
        {entries.map(entry => {
          const company  = companyMap[entry.companyId]
          const project  = company?.projects?.find(p => p.id === entry.projectId)
          const color    = company?.color ?? '#6366f1'
          const moved    = getMovedPosition(entry)
          const isMoving = !!moved

          const leftPct  = moved ? moved.leftPct  : timeToPercent(entry.start)
          const widthPct = moved ? moved.widthPct : durationToPercent(entry.duration)

          const showText  = widthPct > 4
          const showEmoji = widthPct > 2 && project?.emoji

          // Label shown inside block
          const blockLabel = isMoving
            ? `${moved.startTime} – ${moved.endTime}`
            : fmtDurationShort(entry.duration)

          return (
            <div
              key={entry.id}
              className={`tl-block${isMoving ? ' tl-block--moving' : ''}${onBlockMove ? ' tl-block--draggable' : ''}`}
              style={{
                left:       `${leftPct}%`,
                width:      `${Math.max(widthPct, 0.4)}%`,
                background: color,
              }}
              onMouseDown={e => handleBlockMouseDown(e, entry)}
              title={`${fmtTime(entry.start)} – ${fmtTime(entry.end)}${company ? '\n'+company.name : ''}${project ? ' · '+(project.emoji??'')+' '+project.name : ''}`}
            >
              {showEmoji && <span className="tl-block-emoji">{project.emoji}</span>}
              {showText  && <span className="tl-block-label">{blockLabel}</span>}
            </div>
          )
        })}

        {/* ── Create-by-drag preview ── */}
        {dragRange && (
          <>
            <div
              className="tl-drag-preview"
              style={{ left: `${drMinPct}%`, width: `${Math.max(drMaxPct - drMinPct, 0.2)}%` }}
            />
            {drEndM > drStartM && (
              <div className="tl-drag-label" style={{ left: `${(drMinPct + drMaxPct) / 2}%` }}>
                {minsToTime(drStartM)} – {minsToTime(drEndM)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
