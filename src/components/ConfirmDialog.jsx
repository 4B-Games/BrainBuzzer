import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Reusable confirmation dialog.
 * variant: 'danger' (red, for irreversible) | 'warning' (accent, for reversible like archiving)
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel  = 'Abbrechen',
  onConfirm,
  onCancel,
  variant = 'danger',
}) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>

        <p className="confirm-msg">{message}</p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`confirm-action-btn confirm-action-btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
