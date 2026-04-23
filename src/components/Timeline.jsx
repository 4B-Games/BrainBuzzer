import { useState, useRef, useMemo } from 'react'
import { fmtTime, fmtDurationShort } from '../utils/format.js'

const VIEWPORT_HOURS  = 12
const MAX_VIEW_START  = 24 - VIEWPORT_HOURS   // = 12
const MIN_BLOCK_MINS  = 5                     // minimum block duration when resizing

// ── Math helpers ─────────────────────────────────────────────────

function timeToViewPct(isoString, viewStart) {
  const d    = new Date(isoString)
  const mins = d.getHours() * 60 + d.getMinutes()
  return ((mins - viewStart * 60) / (VIEWPORT_HOURS * 60)) * 100
}

function durToViewPct(seconds) {
  return (seconds / (VIEWPORT_HOURS * 3600)) * 100
}

function relPct(e, el) {
  const r = el.getBoundingClientRect()
  return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
}

function pctToMidMins(pct, viewStart) {
  return viewStart * 60 + (pct / 100) * VIEWPORT_HOURS * 60
}

function snap5(m) { return Math.round(m / 5) * 5 }

function midMinsToDate(mins, base) {
  const c = Math.max(0, Math.min(24 * 60, mins))
  const d = new Date(base)
  d.setHours(Math.floor(c / 60), c % 60, 0, 0)
  return d
}

function minsToLabel(m) {
  const h = Math.floor(m / 60)
  return `${String(h < 24 ? h : 0).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

// ── Tick generation ───────────────────────────────────────────────
// Every 10 min: hour → big, 30 min → medium, rest → small

function buildTicks(viewStart) {
  const startM = viewStart * 60
  const endM   = startM + VIEWPORT_HOURS * 60
  const ticks  = []
  const firstM = Math.floor(startM / 10) * 10
  for (let m = firstM; m <= endM; m += 10) {
    if (m < 0 || m > 24 * 60) continue
    const moh  = m % 60
    const type = moh === 0 ? 'hour' : moh === 30 ? 'medium' : 'small'
    const pct  = ((m - startM) / (VIEWPORT_HOURS * 60)) * 100
    ticks.push({ pct, type, label: type === 'hour' ? `${String(Math.floor(m/60)).padStart(2,'0')}:00` : null })
  }
  return ticks
}

// ── Component ─────────────────────────────────────────────────────

export default function Timeline({ entries, companies, onRangeSelect, onBlockMove, date }) {
  const trackRef    = useRef(null)
  const movingRef   = useRef(null)
  const resizingRef = useRef(null)

  const defaultStart = () => {
    const h = new Date().getHours()
    return Math.max(0, Math.min(MAX_VIEW_START, Math.round((h - VIEWPORT_HOURS / 2) * 2) / 2))
  }

  const [viewStart,    setViewStart]    = useState(defaultStart)
  const [dragRange,    setDragRange]    = useState(null)
  const [movingBlock,  setMovingBlock]  = useState(null)
  const [resizingBlock, setResizingBlock] = useState(null)

  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
  const baseDate   = date ?? new Date()
  const ticks      = useMemo(() => buildTicks(viewStart), [viewStart])

  const viewEndH    = viewStart + VIEWPORT_HOURS
  const rangeLabel  = `${String(Math.floor(viewStart)).padStart(2,'0')}:00 – ${String(Math.floor(viewEndH) < 24 ? Math.floor(viewEndH) : 0).padStart(2,'0')}:00`

  function centerOnNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60
    setViewStart(Math.max(0, Math.min(MAX_VIEW_START, Math.round((h - VIEWPORT_HOURS / 2) * 4) / 4)))
  }

  // ── Create-by-drag (empty track) ─────────────────────────────

  function handleTrackMouseDown(e) {
    if (!onRangeSelect) return
    if (e.target.closest('.tl-block')) return
    e.preventDefault()

    const startPct = relPct(e, trackRef.current)
    setDragRange({ startPct, currentPct: startPct })

    function onMove(ev) { setDragRange(p => p ? { ...p, currentPct: relPct(ev, trackRef.current) } : null) }
    function onUp(ev) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const endPct    = relPct(ev, trackRef.current)
      setDragRange(null)
      const startMins = snap5(pctToMidMins(Math.min(startPct, endPct), viewStart))
      const endMins   = snap5(pctToMidMins(Math.max(startPct, endPct), viewStart))
      if (endMins <= startMins) return
      onRangeSelect({ start: midMinsToDate(startMins, baseDate).toISOString(), end: midMinsToDate(endMins, baseDate).toISOString() })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Move block (drag whole block) ─────────────────────────────

  function handleBlockMouseDown(e, entry) {
    if (!onBlockMove) return
    if (e.target.closest('.tl-block-handle')) return   // handled by resize
    e.preventDefault()
    e.stopPropagation()

    const trackWidth = trackRef.current.getBoundingClientRect().width
    const sd         = new Date(entry.start)
    const origMins   = sd.getHours() * 60 + sd.getMinutes()
    const durMins    = Math.round(entry.duration / 60)

    const mb = { entryId: entry.id, origMins, durMins, deltaX: 0, startX: e.clientX, trackWidth }
    movingRef.current = mb
    setMovingBlock({ ...mb })

    function onMove(ev) {
      const u = { ...movingRef.current, deltaX: ev.clientX - movingRef.current.startX }
      movingRef.current = u; setMovingBlock({ ...u })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const mb2 = movingRef.current
      if (mb2) {
        const dMins  = snap5((mb2.deltaX / mb2.trackWidth) * VIEWPORT_HOURS * 60)
        const newS   = Math.max(0, Math.min(24 * 60 - mb2.durMins, mb2.origMins + dMins))
        onBlockMove(mb2.entryId, midMinsToDate(newS, baseDate).toISOString(), midMinsToDate(newS + mb2.durMins, baseDate).toISOString())
      }
      movingRef.current = null; setMovingBlock(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Resize block (drag left or right handle) ──────────────────

  function handleResizeMouseDown(e, entry, side) {
    if (!onBlockMove) return
    e.preventDefault()
    e.stopPropagation()

    const trackWidth   = trackRef.current.getBoundingClientRect().width
    const sd           = new Date(entry.start)
    const ed           = new Date(entry.end)
    const origStartM   = sd.getHours() * 60 + sd.getMinutes()
    const origEndM     = ed.getHours() * 60 + ed.getMinutes()

    const rb = { entryId: entry.id, side, origStartM, origEndM, deltaX: 0, startX: e.clientX, trackWidth }
    resizingRef.current = rb
    setResizingBlock({ ...rb })

    function onMove(ev) {
      const u = { ...resizingRef.current, deltaX: ev.clientX - resizingRef.current.startX }
      resizingRef.current = u; setResizingBlock({ ...u })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const rb2 = resizingRef.current
      if (rb2) {
        const dMins = snap5((rb2.deltaX / rb2.trackWidth) * VIEWPORT_HOURS * 60)
        let newS, newE
        if (rb2.side === 'left') {
          newS = Math.max(0, Math.min(rb2.origEndM - MIN_BLOCK_MINS, rb2.origStartM + dMins))
          newE = rb2.origEndM
        } else {
          newS = rb2.origStartM
          newE = Math.max(rb2.origStartM + MIN_BLOCK_MINS, Math.min(24 * 60, rb2.origEndM + dMins))
        }
        onBlockMove(rb2.entryId, midMinsToDate(newS, baseDate).toISOString(), midMinsToDate(newE, baseDate).toISOString())
      }
      resizingRef.current = null; setResizingBlock(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Compute visual position (move or resize override) ─────────

  function getVisualPos(entry) {
    // Move override
    if (movingBlock?.entryId === entry.id) {
      const dMins  = snap5((movingBlock.deltaX / movingBlock.trackWidth) * VIEWPORT_HOURS * 60)
      const newS   = Math.max(0, Math.min(24 * 60 - movingBlock.durMins, movingBlock.origMins + dMins))
      return {
        leftPct:    ((newS - viewStart * 60) / (VIEWPORT_HOURS * 60)) * 100,
        widthPct:   (movingBlock.durMins / (VIEWPORT_HOURS * 60)) * 100,
        startLabel: minsToLabel(newS),
        endLabel:   minsToLabel(newS + movingBlock.durMins),
        type:       'move',
      }
    }
    // Resize override
    if (resizingBlock?.entryId === entry.id) {
      const rb   = resizingBlock
      const dMins = snap5((rb.deltaX / rb.trackWidth) * VIEWPORT_HOURS * 60)
      let newS, newE
      if (rb.side === 'left') {
        newS = Math.max(0, Math.min(rb.origEndM - MIN_BLOCK_MINS, rb.origStartM + dMins))
        newE = rb.origEndM
      } else {
        newS = rb.origStartM
        newE = Math.max(rb.origStartM + MIN_BLOCK_MINS, Math.min(24 * 60, rb.origEndM + dMins))
      }
      return {
        leftPct:    ((newS - viewStart * 60) / (VIEWPORT_HOURS * 60)) * 100,
        widthPct:   ((newE - newS) / (VIEWPORT_HOURS * 60)) * 100,
        startLabel: minsToLabel(newS),
        endLabel:   minsToLabel(newE),
        type:       'resize',
      }
    }
    return null
  }

  // ── Drag range preview ────────────────────────────────────────

  const drMinPct = dragRange ? Math.min(dragRange.startPct, dragRange.currentPct) : 0
  const drMaxPct = dragRange ? Math.max(dragRange.startPct, dragRange.currentPct) : 0
  const drStartM = dragRange ? snap5(pctToMidMins(drMinPct, viewStart)) : 0
  const drEndM   = dragRange ? snap5(pctToMidMins(drMaxPct, viewStart)) : 0

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="timeline">
      {onRangeSelect && (
        <p className="timeline-hint">
          Freie Fläche ziehen → Eintrag erstellen &nbsp;·&nbsp; Block ziehen → verschieben &nbsp;·&nbsp; ◀▶ an Blockenden → Größe ändern
        </p>
      )}

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
            const visual   = getVisualPos(entry)
            const isActive = !!visual

            const leftPct  = visual ? visual.leftPct  : timeToViewPct(entry.start, viewStart)
            const widthPct = visual ? visual.widthPct : durToViewPct(entry.duration)
            const label    = isActive
              ? `${visual.startLabel} – ${visual.endLabel}`
              : fmtDurationShort(entry.duration)

            return (
              <div
                key={entry.id}
                className={[
                  'tl-block',
                  onBlockMove ? 'tl-block--draggable' : '',
                  visual?.type === 'move'   ? 'tl-block--moving'   : '',
                  visual?.type === 'resize' ? 'tl-block--resizing' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.25)}%`, background: color }}
                onMouseDown={e => handleBlockMouseDown(e, entry)}
                title={`${fmtTime(entry.start)} – ${fmtTime(entry.end)}${company ? '\n' + company.name : ''}${project ? ' · ' + (project.emoji ?? '') + ' ' + project.name : ''}`}
              >
                {/* Left resize handle */}
                {onBlockMove && (
                  <div className="tl-block-handle tl-block-handle--left"
                    onMouseDown={e => handleResizeMouseDown(e, entry, 'left')} />
                )}

                {widthPct > 2 && project?.emoji && <span className="tl-block-emoji">{project.emoji}</span>}
                {widthPct > 3.5 && <span className="tl-block-label">{label}</span>}

                {/* Right resize handle */}
                {onBlockMove && (
                  <div className="tl-block-handle tl-block-handle--right"
                    onMouseDown={e => handleResizeMouseDown(e, entry, 'right')} />
                )}
              </div>
            )
          })}

          {/* Create-drag preview */}
          {dragRange && (
            <>
              <div className="tl-drag-preview"
                style={{ left: `${drMinPct}%`, width: `${Math.max(drMaxPct - drMinPct, 0.2)}%` }} />
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
          <input type="range" className="tl-slider"
            min={0} max={MAX_VIEW_START} step={0.25} value={viewStart}
            onChange={e => setViewStart(parseFloat(e.target.value))} />
          <span className="tl-slider-range-label">{rangeLabel}</span>
        </div>
        <span className="tl-slider-bound">24:00</span>
        <button className="tl-now-btn" onClick={centerOnNow}>Jetzt</button>
      </div>
    </div>
  )
}
