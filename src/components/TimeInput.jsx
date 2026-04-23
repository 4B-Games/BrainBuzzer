import { useState, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

function SpinnerCol({ value, max, onChange }) {
  function spin(dir) {
    onChange((value + dir + max) % max)
  }

  function handleWheel(e) {
    e.preventDefault()
    spin(e.deltaY < 0 ? 1 : -1)
  }

  return (
    <div className="ti-col">
      <button type="button" className="ti-btn" onClick={() => spin(1)}>
        <ChevronUp size={16} />
      </button>
      <div
        className="ti-value"
        onWheel={handleWheel}
        tabIndex={-1}
      >
        {String(value).padStart(2, '0')}
      </div>
      <button type="button" className="ti-btn" onClick={() => spin(-1)}>
        <ChevronDown size={16} />
      </button>
    </div>
  )
}

/**
 * TimeInput – two-way synced time widget.
 * Props:
 *   value    – "HH:MM" string
 *   onChange – called with new "HH:MM" string
 *   label    – optional label text
 */
export default function TimeInput({ value, onChange, label }) {
  const parse = (v) => {
    const [hStr, mStr] = (v ?? '00:00').split(':')
    return { h: Math.min(23, Math.max(0, parseInt(hStr) || 0)), m: Math.min(59, Math.max(0, parseInt(mStr) || 0)) }
  }

  const [h, setH] = useState(() => parse(value).h)
  const [m, setM] = useState(() => parse(value).m)

  // Sync internal state when the prop changes from outside
  useEffect(() => {
    const parsed = parse(value)
    setH(parsed.h)
    setM(parsed.m)
  }, [value])

  const emit = useCallback((newH, newM) => {
    onChange(`${String(newH).padStart(2,'0')}:${String(newM).padStart(2,'0')}`)
  }, [onChange])

  function handleHours(newH) { setH(newH); emit(newH, m) }
  function handleMins(newM)  { setM(newM); emit(h, newM) }

  function handleTextChange(e) {
    const v = e.target.value
    const parsed = parse(v)
    setH(parsed.h)
    setM(parsed.m)
    onChange(v)  // pass raw so the form can validate
  }

  return (
    <div className="ti-wrapper">
      {label && <span className="ti-label">{label}</span>}

      {/* Option 1 – Visual spinner */}
      <div className="ti-spinner-row">
        <SpinnerCol value={h} max={24} onChange={handleHours} />
        <span className="ti-colon">:</span>
        <SpinnerCol value={m} max={60} onChange={handleMins} />
      </div>

      {/* Option 2 – Direct text input */}
      <div className="ti-text-row">
        <span className="ti-text-or">oder</span>
        <input
          type="time"
          className="ti-text-input"
          value={`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
          onChange={handleTextChange}
          step="60"
        />
      </div>
    </div>
  )
}
