import { useState, useRef, useMemo } from 'react'
import { fmtTime, fmtDurationShort } from '../utils/format.js'

const VIEWPORT_HOURS = 12          // hours visible at once
const MAX_VIEW_START = 24 - VIEWPORT_HOURS  // slider max = 12

// ── Helpers ──────────────────────────────────────────────────────

/** Converts an ISO time to % position within the current viewport */
function timeToViewPct(isoString, viewStart) {
  const d = new Date(isoString)
  const totalMins = d.getHours() * 60 + d.getMinutes()
  return ((totalMins - viewStart * 60) / (VIEWPORT_HOURS * 60)) * 100
}

/** Converts duration in seconds to % of viewport width */
function durToViewPct(seconds) {
  return (seconds / (VIEWPORT_HOURS * 3600)) * 100
}

/** Gets the mouse position as % of track width */
function relPct(e, trackEl) {
  const rect = trackEl.getBoundingClientRect()
  return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
}

/** Converts % within viewport to minutes-from-midnight */
function pctToMidnightMins(pct, viewStart) {
  return viewStart * 60 + (pct / 100) * VIEWPORT_HOURS * 60
}

/** Snaps minutes-from-midnight to nearest 5-min mark */
function snap5(minsFromMidnight) {
  return Math.round(minsFromMidnight / 5) * 5
}

/** Builds a Date from minutes-from-midnight and a base date */
function midnightMinsToDate(mins, baseDate) {
  const c = Math.max(0, Math.min(24 * 60, mins))
  const d = new Date(baseDate)
  d.setHours(Math.floor(c / 60), c % 60, 0, 0)
  return d
}

function padH(n) { return String(Math.min(n, 23)).padStart(2, '0') }
function minsToLabel(mFromMidnight) {
  const h = Math.floor(mFromMidnight / 60)
  const m = mFromMidnight % 60
  return `${String(h < 24 ? h : 0).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// ── Tick generation ───────────────────────────────────────────────
// Pattern every 60 min: hour(big), 10m(small), 20m(small), 30m(medium), 40m(small), 50m(small)

function buildTicks(viewStart) {
  const startM = viewStart * 60
  const endM   = startM + VIEWPORT_HOURS * 60
  const ticks  = []

  // start from the nearest 10-min boundary at or before startM
  const firstM = Math.floor(startM / 10) * 10
  for (let m = firstM; m <= endM; m += 10) {
    if (m < 0 || m > 24 * 60) continue
    const minuteOfHour = m % 60
    const type =
      minuteOfHour === 0  ? 'hour'   :
      minuteOfHour === 30 ? 'medium' : 'small'
    const pct = ((m - startM) / (VIEWPORT_HOURS * 60)) * 100
    const h   = Math.floor(m / 60)
    ticks.push({
      pct,
      type,
      label: type === 'hour' ? `${String(h < 24 ? h : 0).padStart(2,'0')}:00` : null,
    })
  }
  return ticks
}

// ── Component ─────────────────────────────────────────────────────

export default function Timeline({ entries, companies, onRangeSelect, onBlockMove, date }) {
  const trackRef  = useRef(null)
  const movingRef = useRef(null)

  // default view: centre on current hour (or 08:00)
  const defaultStart = () => {
    const h = new Date().getHours()
    const s = Math.max(0, Math.min(MAX_VIEW_START, h - VIEWPORT_HOURS / 2))
    return Math.round(s * 2) / 2  // snap to 30-min
  }

  const [viewStart,   setViewStart]   = useState(defaultStart)
  const [dragRange,   setDragRange]   = useState(null)
  const [movingBlock, setMovingBlock] = useState(null)

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
  const baseDate   = date ?? new Date()
  const ticks      = useMemo(() => buildTicks(viewStart), [viewStart])

  const viewEndH   = viewStart + VIEWPORT_HOURS
  const sliderLabel = `${padH(Math.floor(viewStart))}:${String(Math.round((viewStart % 1) * 60)).padStart(2,'0')} – ${padH(Math.floor(viewEndH))}:${String(Math.round((viewEndH % 1) * 60)).padStart(2,'0')}`

  function centerOnNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60
    const s = Math.max(0, Math.min(MAX_VIEW_START, h - VIEWPORT_HOURS / 2))
    setViewStart(Math.round(s * 4) / 4)
  }

  // ── Create-by-drag ────────────────────────────────────────────

  function handleTrackMouseDown(e) {
    if (!onRangeSelect) return
    if (e.target.closest('.tl-block')) return
    e.preventDefault()

    const startPct = relPct(e, trackRef.current)
    setDragRange({ startPct, currentPct: startPct })

    function onMove(ev) {
      setDragRange(prev => prev ? { ...prev, currentPct: relPct(ev, trackRef.current) } : null)
    }
    function onUp(ev) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const endPct = relPct(ev, trackRef.current)
      setDragRange(null)

      const startMins = snap5(pctToMidnightMins(Math.min(startPct, endPct), viewStart))
      const endMins   = snap5(pctToMidnightMins(Math.max(startPct, endPct), viewStart))
      if (endMins <= startMins) return

      onRangeSelect({
        start: midnightMinsToDate(startMins, baseDate).toISOString(),
        end:   midnightMinsToDate(endMins,   baseDate).toISOString(),
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Drag-to-move existing block ───────────────────────────────

  function handleBlockMouseDown(e, entry) {
    if (!onBlockMove) return
    e.preventDefault()
    e.stopPropagation()

    const trackWidth   = trackRef.current.getBoundingClientRect().width
    const sd           = new Date(entry.start)
    const origMins     = sd.getHours() * 60 + sd.getMinutes()  // from midnight
    const durationMins = Math.round(entry.duration / 60)

    const mb = { entryId: entry.id, origMins, durationMins, deltaX: 0, startX: e.clientX, trackWidth }
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
      const mb2 = movingRef.current
      if (mb2) {
        const deltaMins   = Math.round((mb2.deltaX / mb2.trackWidth) * VIEWPORT_HOURS * 60 / 5) * 5
        const newStart    = Math.max(0, Math.min(24 * 60 - mb2.durationMins, mb2.origMins + deltaMins))
        const newEnd      = newStart + mb2.durationMins
        onBlockMove(
          mb2.entryId,
          midnightMinsToDate(newStart, baseDate).toISOString(),
          midnightMinsToDate(newEnd,   baseDate).toISOString()
        )
      }
      movingRef.current = null
      setMovingBlock(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function getMovedPos(entry) {
    if (!movingBlock || movingBlock.entryId !== entry.id) return null
    const deltaMins   = Math.round((movingBlock.deltaX / movingBlock.trackWidth) * VIEWPORT_HOURS * 60 / 5) * 5
    const newStartM   = Math.max(0, Math.min(24 * 60 - movingBlock.durationMins, movingBlock.origMins + deltaMins))
    const newEndM     = newStartM + movingBlock.durationMins
    const leftPct     = ((newStartM - viewStart * 60) / (VIEWPORT_HOURS * 60)) * 100
    const widthPct    = (movingBlock.durationMins / (VIEWPORT_HOURS * 60)) * 100
    return { leftPct, widthPct, startLabel: minsToLabel(newStartM), endLabel: minsToLabel(newEndM) }
  }

  // ── Drag range labels ─────────────────────────────────────────

  const drMinPct = dragRange ? Math.min(dragRange.startPct, dragRange.currentPct) : 0
  const drMaxPct = dragRange ? Math.max(dragRange.startPct, dragRange.currentPct) : 0
  const drStartM = dragRange ? snap5(pctToMidnightMins(drMinPct, viewStart)) : 0
  const drEndM   = dragRange ? snap5(pctToMidnightMins(drMaxPct, viewStart)) : 0

  return (
    <div className="timeline">
      {onRangeSelect && (
        <p className="timeline-hint">
          Freie Fläche ziehen → neuer Eintrag &nbsp;·&nbsp; Block ziehen → Zeit verschieben
        </p>
      )}

      {/* Track */}
      <div className="timeline-track-wrap">
        <div className="timeline-blocks-bg" />

        <div
          className={`timeline-track${onRangeSelect ? ' timeline-track--interactive' : ''}`}
          ref={trackRef}
          onMouseDown={handleTrackMouseDown}
        >
          {/* Ticks */}
          {ticks.map(({ pct, type, label }) => (
            <div key={pct} className={`tl-tick tl-tick--${type}`} style={{ left: `${pct}%` }}>
              {label && <span className="tl-tick-label">{label}</span>}
              <div className="tl-tick-line" />
            </div>
          ))}

          {/* Blocks */}
          {entries.map(entry => {
            const company  = companyMap[entry.companyId]
            const project  = company?.projects?.find(p => p.id === entry.projectId)
            const color    = company?.color ?? '#6366f1'
            const moved    = getMovedPos(entry)
            const isMoving = !!moved

            const leftPct  = moved ? moved.leftPct  : timeToViewPct(entry.start, viewStart)
            const widthPct = moved ? moved.widthPct : durToViewPct(entry.duration)

            const blockLabel = isMoving
              ? `${moved.startLabel} – ${moved.endLabel}`
              : fmtDurationShort(entry.duration)

            return (
              <div
                key={entry.id}
                className={`tl-block${isMoving ? ' tl-block--moving' : ''}${onBlockMove ? ' tl-block--draggable' : ''}`}
                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.3)}%`, background: color }}
                onMouseDown={e => handleBlockMouseDown(e, entry)}
                title={`${fmtTime(entry.start)} – ${fmtTime(entry.end)}${company ? '\n' + company.name : ''}${project ? ' · ' + (project.emoji ?? '') + ' ' + project.name : ''}`}
              >
                {widthPct > 2 && project?.emoji && (
                  <span className="tl-block-emoji">{project.emoji}</span>
                )}
                {widthPct > 3.5 && (
                  <span className="tl-block-label">{blockLabel}</span>
                )}
              </div>
            )
          })}

          {/* Create-drag preview */}
          {dragRange && (
            <>
              <div
                className="tl-drag-preview"
                style={{ left: `${drMinPct}%`, width: `${Math.max(drMaxPct - drMinPct, 0.2)}%` }}
              />
              {drEndM > drStartM && (
                <div className="tl-drag-label" style={{ left: `${(drMinPct + drMaxPct) / 2}%` }}>
                  {minsToLabel(drStartM)} – {minsToLabel(drEndM)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Viewport slider */}
      <div className="tl-slider-row">
        <span className="tl-slider-bound">00:00</span>
        <div className="tl-slider-wrap">
          <input
            type="range"
            className="tl-slider"
            min={0}
            max={MAX_VIEW_START}
            step={0.25}
            value={viewStart}
            onChange={e => setViewStart(parseFloat(e.target.value))}
          />
          <span className="tl-slider-range-label">{sliderLabel}</span>
        </div>
        <span className="tl-slider-bound">24:00</span>
        <button className="tl-now-btn" onClick={centerOnNow} title="Jetzt zentrieren">
          Jetzt
        </button>
      </div>
    </div>
  )
}
