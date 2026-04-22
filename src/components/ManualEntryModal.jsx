import { useState } from 'react'
import { X } from 'lucide-react'
import { uid, fmtDateInput, fmtTimeInput } from '../utils/format.js'
import { addEntry } from '../services/dataService.js'

export default function ManualEntryModal({ companies, onClose, onSaved }) {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [companyId, setCompanyId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(fmtDateInput(now))
  const [timeFrom, setTimeFrom] = useState(fmtTimeInput(oneHourAgo))
  const [timeTo, setTimeTo] = useState(fmtTimeInput(now))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const selectedCompany = companies.find(c => c.id === companyId)

  function handleCompanyChange(id) {
    setCompanyId(id)
    setProjectId('')
  }

  function handleSave() {
    if (!companyId) { setError('Bitte ein Unternehmen wählen.'); return }

    const start = new Date(`${date}T${timeFrom}`)
    const end = new Date(`${date}T${timeTo}`)
    if (isNaN(start) || isNaN(end)) { setError('Ungültige Zeitangaben.'); return }
    if (end <= start) { setError('"Bis" muss nach "Von" liegen.'); return }

    const duration = Math.floor((end - start) / 1000)
    addEntry({
      id: uid(),
      userId: 'local-user',
      companyId,
      projectId: projectId || null,
      start: start.toISOString(),
      end: end.toISOString(),
      duration,
      note,
    })
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Manuell erfassen</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="form-group">
          <label>Unternehmen</label>
          <select value={companyId} onChange={e => handleCompanyChange(e.target.value)}>
            <option value="">— bitte wählen —</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selectedCompany && selectedCompany.projects.length > 0 && (
          <div className="form-group">
            <label>Projekt</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">— kein Projekt —</option>
              {selectedCompany.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Von</label>
            <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Bis</label>
            <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Notiz</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optionale Notiz …"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  )
}
