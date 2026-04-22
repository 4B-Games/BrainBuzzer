import { useState, useEffect } from 'react'
import { Play, PlusCircle } from 'lucide-react'
import { useTimer } from '../hooks/useTimer.js'
import { getCompanies, addEntry } from '../services/dataService.js'
import { uid, fmtDuration } from '../utils/format.js'
import TileGrid from '../components/TileGrid.jsx'
import TimerBanner from '../components/TimerBanner.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'

export default function TimerView({ onEntryStart, onEntryStop, onDataChange, activeEntry }) {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [note, setNote] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [timerStart, setTimerStart] = useState(null)

  const { running, elapsed, start, stop, reset } = useTimer()

  useEffect(() => {
    setCompanies(getCompanies())
  }, [])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const selectedProject = selectedCompany?.projects.find(p => p.id === selectedProjectId)

  function handleCompanySelect(id) {
    if (running) return
    setSelectedCompanyId(id)
    setSelectedProjectId(null)
  }

  function handleProjectSelect(id) {
    if (running) return
    setSelectedProjectId(id)
  }

  function handleStart() {
    if (!selectedCompanyId) return
    const startIso = start()
    setTimerStart(startIso)
    onEntryStart({
      companyId: selectedCompanyId,
      companyName: selectedCompany?.name ?? '',
      companyColor: selectedCompany?.color ?? '#6366f1',
      projectName: selectedProject?.name ?? '',
      elapsed: 0,
    })
  }

  // Keep activeEntry elapsed in sync via a small trick: re-broadcast on each render
  useEffect(() => {
    if (running && activeEntry) {
      onEntryStart({ ...activeEntry, elapsed })
    }
  }, [elapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStop() {
    const { end, duration } = stop()
    addEntry({
      id: uid(),
      userId: 'local-user',
      companyId: selectedCompanyId,
      projectId: selectedProjectId ?? null,
      start: timerStart,
      end,
      duration,
      note,
    })
    onEntryStop()
    onDataChange()
    setNote('')
    reset()
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Timer</h1>
        <button className="btn-secondary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} />
          Manuell erfassen
        </button>
      </div>

      {running && activeEntry && (
        <TimerBanner activeEntry={{ ...activeEntry, elapsed }} onStop={handleStop} />
      )}

      {!running && (
        <>
          <section className="section">
            <h2 className="section-title">Unternehmen wählen</h2>
            <TileGrid
              items={companies}
              selected={selectedCompanyId}
              onSelect={handleCompanySelect}
              emptyText="Noch keine Unternehmen – bitte in den Einstellungen anlegen."
            />
          </section>

          {selectedCompany && selectedCompany.projects.length > 0 && (
            <section className="section">
              <h2 className="section-title">Projekt wählen</h2>
              <TileGrid
                items={selectedCompany.projects.map(p => ({
                  ...p,
                  color: selectedCompany.color,
                }))}
                selected={selectedProjectId}
                onSelect={handleProjectSelect}
              />
            </section>
          )}

          {selectedCompanyId && (
            <section className="section">
              <div className="timer-actions">
                <input
                  className="note-input"
                  type="text"
                  placeholder="Optionale Notiz …"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button
                  className="btn-start"
                  onClick={handleStart}
                  style={{ background: selectedCompany?.color }}
                >
                  <Play size={18} fill="currentColor" />
                  Starten
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {running && (
        <div className="timer-running-display">
          <div className="timer-clock" style={{ color: selectedCompany?.color }}>
            {fmtDuration(elapsed)}
          </div>
          <p className="timer-running-label">
            {selectedCompany?.name}
            {selectedProject ? ` · ${selectedProject.name}` : ''}
          </p>
        </div>
      )}

      {showModal && (
        <ManualEntryModal
          companies={companies}
          onClose={() => setShowModal(false)}
          onSaved={() => { onDataChange(); setCompanies(getCompanies()) }}
        />
      )}
    </div>
  )
}
