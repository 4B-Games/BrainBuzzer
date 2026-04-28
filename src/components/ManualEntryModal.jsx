import { useState } from 'react'
import { X } from 'lucide-react'
import { uid, fmtDateInput, fmtTimeInput } from '../utils/format.js'
import { addEntry, getActiveCompanies } from '../services/dataService.js'
import { getCurrentUser } from '../services/authService.js'
import TimeInput from './TimeInput.jsx'

function roundTo5Min(date) {
  const d = new Date(date)
  d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0)
  return d
}

export default function ManualEntryModal({ companies, onClose, onSaved, prefilledTimes }) {
  const now = new Date()

  const initDate  = prefilledTimes?.start ? fmtDateInput(new Date(prefilledTimes.start)) : fmtDateInput(now)
  const initFrom  = prefilledTimes?.start ? fmtTimeInput(new Date(prefilledTimes.start)) : fmtTimeInput(roundTo5Min(new Date(now.getTime() - 3600_000)))
  const initTo    = prefilledTimes?.end   ? fmtTimeInput(new Date(prefilledTimes.end))   : fmtTimeInput(roundTo5Min(now))

  const [companyId, setCompanyId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [date,      setDate]      = useState(initDate)
  const [timeFrom,  setTimeFrom]  = useState(initFrom)
  const [timeTo,    setTimeTo]    = useState(initTo)
  const [note,      setNote]      = useState('')
  const [error,     setError]     = useState('')

  const selectedCompany = companies.find(c => c.id === companyId)

  function handleCompanyChange(id) { setCompanyId(id); setProjectId('') }

  function handleSave() {
    if (!companyId) { setError('Bitte ein Unternehmen wählen.'); return }
    const start = new Date(`${date}T${timeFrom}`)
    const end   = new Date(`${date}T${timeTo}`)
    if (isNaN(start) || isNaN(end)) { setError('Ungültige Zeitangaben.'); return }
    if (end <= start) { setError('"Bis" muss nach "Von" liegen.'); return }

    const user = getCurrentUser()
    addEntry({
      id: uid(),
      userId: user?.id ?? 'unknown',
      companyId,
      projectId: projectId || null,
      start: start.toISOString(),
      end:   end.toISOString(),
      duration: Math.floor((end - start) / 1000),
      note,
    })
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--xl">
        <div className="modal-header">
          <h2>Manuell erfassen</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="form-row">
          <div className="form-group">
            <label>Unternehmen</label>
            <select value={companyId} onChange={e => handleCompanyChange(e.target.value)}>
              <option value="">— bitte wählen —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCompany?.projects.length > 0 ? (
            <div className="form-group">
              <label>Projekt</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">— kein Projekt —</option>
                {selectedCompany.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.emoji ? p.emoji + ' ' : ''}{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Datum</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          )}
        </div>

        {selectedCompany?.projects.length > 0 && (
          <div className="form-group">
            <label>Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        )}

        <div className="form-row form-row--time">
          <TimeInput label="Von" value={timeFrom} onChange={setTimeFrom} />
          <TimeInput label="Bis" value={timeTo}   onChange={setTimeTo}   />
        </div>

        <div className="form-group">
          <label>Notiz</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Optionale Notiz …" />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  )
}
