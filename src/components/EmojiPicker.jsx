import { useState, useEffect, useRef } from 'react'

const EMOJIS = [
  '💻','🖥️','📱','🎨','🔧','📊','📈','📝','🎯','🚀',
  '💡','🔬','📦','🛠️','🎭','📌','🏗️','🔐','📧','🗓️',
  '⚙️','🎬','🎵','🌐','📚','🧪','🧩','🏆','💼','🤝',
  '📞','🖊️','📋','🗂️','📐','🔑','💰','🌟','⭐','🏠',
  '🚗','✈️','🎪','🔴','🟡','🟢','🔵','🟣','⚫','⚪',
]

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="emoji-picker-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="emoji-trigger"
        onClick={() => setOpen(o => !o)}
        title="Emoji wählen"
      >
        {value || '📁'}
      </button>

      {open && (
        <div className="emoji-popover">
          {value && (
            <button
              type="button"
              className="emoji-clear"
              onClick={() => { onChange(''); setOpen(false) }}
            >
              ✕ Kein Emoji
            </button>
          )}
          <div className="emoji-grid">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className={`emoji-option${value === e ? ' selected' : ''}`}
                onClick={() => { onChange(e); setOpen(false) }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
