import { useState, useRef, useMemo, useEffect } from 'react'
import { Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { fmtTime, fmtDurationShort } from '../utils/format.js'

const ZOOM_OPTIONS  = [2, 3, 4, 6, 8, 12]   // viewport hours options
const ZOOM_DEFAULT  = 6
const MIN_BLOCK_MINS = 5
const LS_ZOOM_KEY   = 'bb_tl_zoom'

// ── Helpers (accept vh = viewport hours) ─────────────────────────

function timeToViewPct(iso, vs, vh) {
  const d = new Date(iso)
  return ((d.getHours() * 60 + d.getMinutes() - vs * 60) / (vh * 60)) * 100
}
function durToViewPct(sec, vh)       { return (sec / (vh * 3600)) * 100 }
function relPct(e, el)               { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)) }
function pctToMidMins(p, vs, vh)     { return vs * 60 + (p / 100) * vh * 60 }
function snap5(m)                    { return Math.round(m / 5) * 5 }
function midMinsToDate(m, b)         { const c=Math.max(0,Math.min(24*60,m)), d=new Date(b); d.setHours(Math.floor(c/60),c%60,0,0); return d }
function minsToLabel(m)              { const h=Math.floor(m/60); return `${String(h<24?h:0).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }

function buildTicks(vs, vh) {
  const startM = vs * 60, endM = startM + vh * 60, ticks = []
  const firstM = Math.floor(startM / 5) * 5   // 5-minute steps
  for (let m = firstM; m <= endM; m += 5) {
    if (m < 0 || m > 24 * 60) continue
    const moh = m % 60
    // Type hierarchy: hour > medium (30m) > quarter (15/45m) > small (10/20/40/50) > tiny (5/25/35/55)
    const type =
      moh === 0               ? 'hour'    :
      moh === 30              ? 'medium'  :
      moh === 15 || moh === 45 ? 'quarter' :
      moh % 10 === 0          ? 'small'   : 'tiny'
    const pct  = ((m - startM) / (vh * 60)) * 100
    const h    = Math.floor(m / 60), hStr = String(h < 24 ? h : 0).padStart(2,'0')
    const label = type === 'hour' ? `${hStr}:00` : type === 'medium' ? `${hStr}:30` : null
    ticks.push({ pct, type, label })
  }
  return ticks
}

// ── Block editor sub-component ────────────────────────────────────

function BlockEditor({ entry, companies, pos, onSave, onDelete, onClose }) {
  const [companyId, setCompanyId] = useState(entry.companyId ?? '')
  const [projectId, setProjectId] = useState(entry.projectId ?? '')
  const [confirmDel, setConfirmDel] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function h(e) { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const selectedCo = companies.find(c => c.id === companyId)

  if (confirmDel) {
    return (
      <div ref={ref} className="tl-block-editor" style={{ top: pos.top, left: pos.left }}>
        <div className="tl-be-header">
          <span>Eintrag löschen?</span>
          <button className="tl-be-close" onClick={onClose}>✕</button>
        </div>
        <div className="tl-be-body" style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </div>
        <div className="tl-be-actions">
          <button className="tl-be-cancel" onClick={() => setConfirmDel(false)}>Abbrechen</button>
          <button className="tl-be-delete-confirm" onClick={() => { onDelete(entry.id); onClose() }}>
            <Trash2 size={13} /> Löschen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="tl-block-editor" style={{ top: pos.top, left: pos.left }}>
      <div className="tl-be-header">
        <span>Eintrag anpassen</span>
        <button className="tl-be-close" onClick={onClose}>✕</button>
      </div>
      <div className="tl-be-body">
        <label className="tl-be-label">Unternehmen</label>
        <select className="tl-be-select" value={companyId}
          onChange={e => { setCompanyId(e.target.value); setProjectId('') }}>
          <option value="">— wählen —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedCo?.projects.length > 0 && (
          <>
            <label className="tl-be-label">Projekt</label>
            <select className="tl-be-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">— kein Projekt —</option>
              {selectedCo.projects.map(p => (
                <option key={p.id} value={p.id}>{p.emoji ? p.emoji + ' ' : ''}{p.name}</option>
              ))}
            </select>
          </>
        )}
      </div>
      <div className="tl-be-actions">
        <button className="tl-be-trash" onClick={() => setConfirmDel(true)} title="Löschen">
          <Trash2 size={14} />
        </button>
        <button className="tl-be-cancel" onClick={onClose}>Abbrechen</button>
        <button className="tl-be-save" onClick={() => {
          onSave(entry.id, { companyId: companyId || null, projectId: projectId || null })
          onClose()
        }}>Speichern</button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────

export default function Timeline({ entries, companies, onRangeSelect, onBlockMove, onBlockDelete, onBlockUpdate, liveEntry, date }) {
  const trackRef    = useRef(null)
  const movingRef   = useRef(null)
  const resizingRef = useRef(null)

  // ── Zoom (persisted to localStorage) ────────────────────────────
  const [viewportHours, setViewportHoursState] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_ZOOM_KEY))
    return ZOOM_OPTIONS.includes(saved) ? saved : ZOOM_DEFAULT
  })

  function setZoom(newVH) {
    const center   = viewStart + viewportHours / 2
    const maxStart = 24 - newVH
    const newStart = Math.max(0, Math.min(maxStart, center - newVH / 2))
    setViewStart(Math.round(newStart * 4) / 4)
    setViewportHoursState(newVH)
    localStorage.setItem(LS_ZOOM_KEY, String(newVH))
  }

  const zoomIdx    = ZOOM_OPTIONS.indexOf(viewportHours)
  const canZoomIn  = zoomIdx > 0
  const canZoomOut = zoomIdx < ZOOM_OPTIONS.length - 1

  // ── View position ────────────────────────────────────────────────
  const [viewStart, setViewStart] = useState(() => {
    const h = new Date().getHours()
    return Math.max(0, Math.min(24 - viewportHours, Math.round((h - viewportHours / 2) * 2) / 2))
  })

  const [dragRange,    setDragRange]    = useState(null)
  const [movingBlock,  setMovingBlock]  = useState(null)
  const [resizingBlock,setResizingBlock]= useState(null)
  const [nowTime,      setNowTime]      = useState(() => new Date())
  const [blockEditor,  setBlockEditor]  = useState(null)

  useEffect(() => { const t=setInterval(()=>setNowTime(new Date()),60_000); return ()=>clearInterval(t) }, [])

  const companyMap  = Object.fromEntries(companies.map(c => [c.id, c]))
  const baseDate    = date ?? new Date()
  const maxViewStart = 24 - viewportHours
  const ticks       = useMemo(() => buildTicks(viewStart, viewportHours), [viewStart, viewportHours])

  const viewEndH    = viewStart + viewportHours
  const endHLabel   = viewEndH >= 24 ? '24:00' : `${String(Math.floor(viewEndH)).padStart(2,'0')}:00`
  const rangeLabel  = `${String(Math.floor(viewStart)).padStart(2,'0')}:00 – ${endHLabel}`

  const nowMins     = nowTime.getHours() * 60 + nowTime.getMinutes()
  const nowPct      = ((nowMins - viewStart * 60) / (viewportHours * 60)) * 100
  const nowVisible  = nowPct >= 0 && nowPct <= 100

  function centerOnNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60
    setViewStart(Math.max(0, Math.min(maxViewStart, Math.round((h - viewportHours / 2) * 4) / 4)))
  }

  // ── Create-by-drag ─────────────────────────────────────────────

  function handleTrackMouseDown(e) {
    if (!onRangeSelect) return
    if (e.target.closest('.tl-block')) return
    e.preventDefault()
    const startPct = relPct(e, trackRef.current)
    setDragRange({ startPct, currentPct: startPct })
    function onMove(ev) { setDragRange(p => p ? { ...p, currentPct: relPct(ev, trackRef.current) } : null) }
    function onUp(ev) {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      const endPct = relPct(ev, trackRef.current); setDragRange(null)
      const sM = snap5(pctToMidMins(Math.min(startPct,endPct),viewStart,viewportHours))
      const eM = snap5(pctToMidMins(Math.max(startPct,endPct),viewStart,viewportHours))
      if (eM <= sM) return
      onRangeSelect({ start: midMinsToDate(sM,baseDate).toISOString(), end: midMinsToDate(eM,baseDate).toISOString() })
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  // ── Move block + click-to-edit ─────────────────────────────────

  function handleBlockMouseDown(e, entry) {
    if (!onBlockMove && !onBlockUpdate) return
    if (e.target.closest('.tl-block-handle')) return
    e.preventDefault(); e.stopPropagation()

    const tw   = trackRef.current.getBoundingClientRect().width
    const sd   = new Date(entry.start)
    const orig = sd.getHours() * 60 + sd.getMinutes()
    const dur  = Math.round(entry.duration / 60)
    const mb   = { entryId: entry.id, origMins: orig, durMins: dur, deltaX: 0, startX: e.clientX, startY: e.clientY, trackWidth: tw, hasMoved: false }
    movingRef.current = mb; setMovingBlock({ ...mb })

    function onMove(ev) {
      const curr = movingRef.current; if (!curr) return
      const dx = ev.clientX - curr.startX, dy = ev.clientY - curr.startY
      const hasMoved = curr.hasMoved || Math.abs(dx) > 6 || Math.abs(dy) > 6
      const updated = { ...curr, deltaX: dx, hasMoved }
      movingRef.current = updated; setMovingBlock({ ...updated })
    }

    function onUp(ev) {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      const mb2 = movingRef.current
      movingRef.current = null; setMovingBlock(null)
      if (!mb2) return

      if (!mb2.hasMoved) {
        // CLICK → open inline editor
        const edW = 270, edH = 220
        let top  = ev.clientY + 12
        let left = ev.clientX - edW / 2
        if (top + edH > window.innerHeight - 8) top = ev.clientY - edH - 12
        left = Math.max(8, Math.min(window.innerWidth - edW - 8, left))
        setBlockEditor({ entry, pos: { top, left } })
        return
      }

      if (mb2.hasMoved && onBlockMove) {
        const dM = snap5((mb2.deltaX / mb2.trackWidth) * viewportHours * 60)
        const s  = Math.max(0, Math.min(24 * 60 - mb2.durMins, mb2.origMins + dM))
        onBlockMove(mb2.entryId, midMinsToDate(s,baseDate).toISOString(), midMinsToDate(s+mb2.durMins,baseDate).toISOString())
      }
    }

    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  // ── Resize block ───────────────────────────────────────────────

  function handleResizeMouseDown(e, entry, side) {
    if (!onBlockMove) return
    e.preventDefault(); e.stopPropagation()
    const tw = trackRef.current.getBoundingClientRect().width
    const sd = new Date(entry.start), ed = new Date(entry.end)
    const origS = sd.getHours() * 60 + sd.getMinutes()
    const origE = ed.getHours() * 60 + ed.getMinutes()
    const rb = { entryId: entry.id, side, origStartM: origS, origEndM: origE, deltaX: 0, startX: e.clientX, trackWidth: tw }
    resizingRef.current = rb; setResizingBlock({ ...rb })
    function onMove(ev) {
      const u = { ...resizingRef.current, deltaX: ev.clientX - resizingRef.current.startX }
      resizingRef.current = u; setResizingBlock({ ...u })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
      const rb2 = resizingRef.current; resizingRef.current = null; setResizingBlock(null)
      if (!rb2) return
      const dM = snap5((rb2.deltaX / rb2.trackWidth) * viewportHours * 60)
      let s, en
      if (rb2.side === 'left') { s = Math.max(0, Math.min(rb2.origEndM-MIN_BLOCK_MINS, rb2.origStartM+dM)); en = rb2.origEndM }
      else { s = rb2.origStartM; en = Math.max(rb2.origStartM+MIN_BLOCK_MINS, Math.min(24*60, rb2.origEndM+dM)) }
      onBlockMove(rb2.entryId, midMinsToDate(s,baseDate).toISOString(), midMinsToDate(en,baseDate).toISOString())
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  // ── Visual position override ────────────────────────────────────

  function getVisualPos(entry) {
    if (movingBlock?.entryId === entry.id) {
      const dM = snap5((movingBlock.deltaX / movingBlock.trackWidth) * viewportHours * 60)
      const s  = Math.max(0, Math.min(24*60-movingBlock.durMins, movingBlock.origMins+dM))
      return { leftPct: ((s-viewStart*60)/(viewportHours*60))*100, widthPct: (movingBlock.durMins/(viewportHours*60))*100, startLabel: minsToLabel(s), endLabel: minsToLabel(s+movingBlock.durMins), type: 'move' }
    }
    if (resizingBlock?.entryId === entry.id) {
      const rb = resizingBlock, dM = snap5((rb.deltaX/rb.trackWidth)*viewportHours*60)
      let s, en
      if (rb.side==='left') { s=Math.max(0,Math.min(rb.origEndM-MIN_BLOCK_MINS,rb.origStartM+dM)); en=rb.origEndM }
      else { s=rb.origStartM; en=Math.max(rb.origStartM+MIN_BLOCK_MINS,Math.min(24*60,rb.origEndM+dM)) }
      return { leftPct: ((s-viewStart*60)/(viewportHours*60))*100, widthPct: ((en-s)/(viewportHours*60))*100, startLabel: minsToLabel(s), endLabel: minsToLabel(en), type: 'resize' }
    }
    return null
  }

  const drMinPct = dragRange ? Math.min(dragRange.startPct, dragRange.currentPct) : 0
  const drMaxPct = dragRange ? Math.max(dragRange.startPct, dragRange.currentPct) : 0
  const drStartM = dragRange ? snap5(pctToMidMins(drMinPct,viewStart,viewportHours)) : 0
  const drEndM   = dragRange ? snap5(pctToMidMins(drMaxPct,viewStart,viewportHours)) : 0

  return (
    <div className="timeline">
      <div className="timeline-track-wrap">
        <div className="timeline-blocks-bg" />
        <div
          className={`timeline-track${onRangeSelect ? ' timeline-track--interactive' : ''}`}
          ref={trackRef}
          onMouseDown={handleTrackMouseDown}
        >
          {ticks.map(({ pct, type, label }) => (
            <div key={pct} className={`tl-tick tl-tick--${type}`} style={{ left: `${pct}%` }}>
              <div className="tl-tick-line" />
              {label && <span className="tl-tick-label">{label}</span>}
            </div>
          ))}

          {nowVisible && (
            <div className="tl-now-line" style={{ left: `${nowPct}%` }}>
              <span className="tl-now-label">{String(nowTime.getHours()).padStart(2,'0')}:{String(nowTime.getMinutes()).padStart(2,'0')}</span>
            </div>
          )}

          {entries.map(entry => {
            const company = companyMap[entry.companyId]
            const project = company?.projects?.find(p => p.id === entry.projectId)
            const color   = company?.color ?? '#6366f1'
            const visual  = getVisualPos(entry)
            const isActive = !!visual

            const leftPct  = visual ? visual.leftPct  : timeToViewPct(entry.start, viewStart, viewportHours)
            const widthPct = visual ? visual.widthPct : durToViewPct(entry.duration, viewportHours)

            return (
              <div
                key={entry.id}
                className={[
                  'tl-block',
                  (onBlockMove || onBlockUpdate) ? 'tl-block--draggable' : '',
                  visual?.type === 'move'   ? 'tl-block--moving'   : '',
                  visual?.type === 'resize' ? 'tl-block--resizing' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct,0.25)}%`, background: color }}
                onMouseDown={e => handleBlockMouseDown(e, entry)}
                title="Klicken → bearbeiten / verschieben"
              >
                {onBlockMove && <div className="tl-block-handle tl-block-handle--left"  onMouseDown={e => handleResizeMouseDown(e,entry,'left')} />}

                {isActive ? (
                  widthPct > 3 && <span className="tl-block-label tl-block-label--time">{visual.startLabel} – {visual.endLabel}</span>
                ) : (
                  <div className="tl-block-info">
                    {widthPct > 4 && <span className="tl-block-company">{company?.name ?? ''}</span>}
                    {widthPct > 3 && project && <span className="tl-block-project">{project.emoji ? project.emoji+' ' : ''}{project.name}</span>}
                    {widthPct > 2 && <span className="tl-block-duration">{fmtDurationShort(entry.duration)}</span>}
                    {widthPct <= 2 && widthPct > 1 && project?.emoji && <span className="tl-block-emoji-solo">{project.emoji}</span>}
                  </div>
                )}

                {onBlockMove && <div className="tl-block-handle tl-block-handle--right" onMouseDown={e => handleResizeMouseDown(e,entry,'right')} />}
              </div>
            )
          })}

          {/* ── Live block: grows in real time while timer runs ── */}
          {liveEntry && (() => {
            const leftPct  = timeToViewPct(liveEntry.start, viewStart, viewportHours)
            const widthPct = durToViewPct(liveEntry.elapsed, viewportHours)
            const company  = companyMap[liveEntry.companyId]
            const project  = company?.projects?.find(p => p.id === liveEntry.projectId)
            return (
              <div
                className="tl-block tl-block--live"
                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.3)}%`, background: liveEntry.color }}
              >
                <span className="tl-live-dot" />
                <div className="tl-block-info">
                  {widthPct > 5 && <span className="tl-block-company">{liveEntry.companyName}</span>}
                  {liveEntry.projectName && widthPct > 4 && (
                    <span className="tl-block-project">
                      {liveEntry.projectEmoji ? liveEntry.projectEmoji + ' ' : ''}{liveEntry.projectName}
                    </span>
                  )}
                  {widthPct > 2 && (
                    <span className="tl-block-duration">{fmtDurationShort(liveEntry.elapsed)}</span>
                  )}
                </div>
              </div>
            )
          })()}

          {dragRange && (
            <>
              <div className="tl-drag-preview" style={{ left:`${drMinPct}%`, width:`${Math.max(drMaxPct-drMinPct,0.2)}%` }} />
              {drEndM > drStartM && (
                <div className="tl-drag-label" style={{ left:`${(drMinPct+drMaxPct)/2}%` }}>
                  {minsToLabel(drStartM)} – {minsToLabel(drEndM)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Controls: zoom + position slider */}
      <div className="tl-slider-row">
        {/* Zoom */}
        <div className="tl-zoom">
          <button className="tl-zoom-btn" disabled={!canZoomIn}  onClick={() => setZoom(ZOOM_OPTIONS[zoomIdx - 1])} title="Reinzoomen"><ZoomIn  size={15}/></button>
          <span className="tl-zoom-label">{viewportHours}h</span>
          <button className="tl-zoom-btn" disabled={!canZoomOut} onClick={() => setZoom(ZOOM_OPTIONS[zoomIdx + 1])} title="Rauszoomen"><ZoomOut size={15}/></button>
        </div>

        <span className="tl-slider-bound">00:00</span>
        <div className="tl-slider-wrap">
          <input type="range" className="tl-slider" min={0} max={maxViewStart} step={0.25}
            value={Math.min(viewStart, maxViewStart)}
            onChange={e => setViewStart(parseFloat(e.target.value))} />
          <span className="tl-slider-range-label">{rangeLabel}</span>
        </div>
        <span className="tl-slider-bound">24:00</span>
        <button className="tl-now-btn" onClick={centerOnNow}>Jetzt</button>
      </div>

      {/* Inline block editor */}
      {blockEditor && (
        <BlockEditor
          entry={blockEditor.entry}
          companies={companies}
          pos={blockEditor.pos}
          onSave={(id, changes) => { onBlockUpdate?.(id, changes) }}
          onDelete={(id) => { onBlockDelete?.(id) }}
          onClose={() => setBlockEditor(null)}
        />
      )}
    </div>
  )
}
