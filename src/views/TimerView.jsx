import { useState, useEffect } from 'react'
import { Play, PlusCircle } from 'lucide-react'
import { getCompanies, getEntries, updateEntry } from '../services/dataService.js'
import { fmtDuration, isToday } from '../utils/format.js'
import TileGrid from '../components/TileGrid.jsx'
import TimerBanner from '../components/TimerBanner.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'
import Timeline from '../components/Timeline.jsx'

export default function TimerView({
  timerRunning, timerElapsed,
  onTimerStart, onTimerStop,
  onDataChange, activeEntry,
}) {
  const [companies,      setCompanies]      = useState([])
  const [todayEntries,   setTodayEntries]   = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [note,           setNote]           = useState('')
  const [showModal,      setShowModal]      = useState(false)
  const [prefilledTimes, setPrefilledTimes] = useState(null)
  const [tlVersion,      setTlVersion]      = useState(0)

  function loadData() {
    const cos = getCompanies()
    setCompanies(cos)
    setTodayEntries(
      getEntries().filter(e => isToday(e.start)).sort((a, b) => new Date(a.start) - new Date(b.start))
    )
  }

  useEffect(() => { loadData() }, [tlVersion])

  // Clear note when timer stops
  useEffect(() => { if (!timerRunning) setNote('') }, [timerRunning])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const selectedProject = selectedCompany?.projects.find(p => p.id === selectedProjectId)

  function handleCompanySelect(id) {
    if (timerRunning) return
    setSelectedCompanyId(id)
    setSelectedProjectId(null)
  }

  function handleProjectSelect(id) {
    if (timerRunning) return
    setSelectedProjectId(id)
  }

  function handleStart() {
    if (!selectedCompanyId) return
    onTimerStart({
      companyId:    selectedCompanyId,
      projectId:    selectedProjectId ?? null,
      companyName:  selectedCompany?.name ?? '',
      companyColor: selectedCompany?.color ?? '#6366f1',
      projectName:  selectedProject?.name ?? '',
      projectEmoji: selectedProject?.emoji ?? '',
      note,
    })
  }

  function handleBlockMove(entryId, newStart, newEnd) {
    updateEntry(entryId, {
      start: newStart, end: newEnd,
      duration: Math.floor((new Date(newEnd) - new Date(newStart)) / 1000),
    })
    setTlVersion(v => v + 1)
    onDataChange()
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Timer</h1>
        <button className="btn-secondary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Manuell erfassen
        </button>
      </div>

      {timerRunning && activeEntry && (
        <TimerBanner
          activeEntry={{ ...activeEntry, elapsed: timerElapsed }}
          onStop={onTimerStop}
        />
      )}

      {!timerRunning && (
        <>
          <section className="section">
            <h2 className="section-title">Unternehmen wählen</h2>
            <TileGrid items={companies} selected={selectedCompanyId} onSelect={handleCompanySelect}
              emptyText="Noch keine Unternehmen – bitte in den Einstellungen anlegen." />
          </section>

          {selectedCompany?.projects.length > 0 && (
            <section className="section">
              <h2 className="section-title">Projekt wählen</h2>
              <TileGrid
                items={selectedCompany.projects.map(p => ({ ...p, color: selectedCompany.color }))}
                selected={selectedProjectId}
                onSelect={handleProjectSelect}
              />
            </section>
          )}

          {selectedCompanyId && (
            <section className="section">
              <div className="timer-actions">
                <input className="note-input" type="text" placeholder="Optionale Notiz …"
                  value={note} onChange={e => setNote(e.target.value)} />
                <button className="btn-start" onClick={handleStart}
                  style={{ background: selectedCompany?.color }}>
                  <Play size={18} fill="currentColor" /> Starten
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {timerRunning && (
        <div className="timer-running-display">
          <div className="timer-clock" style={{ color: selectedCompany?.color ?? activeEntry?.companyColor }}>
            {fmtDuration(timerElapsed)}
          </div>
          <p className="timer-running-label">
            {activeEntry?.companyName}
            {activeEntry?.projectName
              ? ` · ${activeEntry.projectEmoji ? activeEntry.projectEmoji + ' ' : ''}${activeEntry.projectName}`
              : ''}
          </p>
          <button className="btn-stop-large" onClick={onTimerStop}>
            ■ &nbsp;Timer stoppen
          </button>
        </div>
      )}

      {/* Today's timeline */}
      <section className="section" style={{ marginBottom: 8 }}>
        <h2 className="section-title">Heutige Einträge – Zeitstrahl</h2>
      </section>

      <div style={{ marginLeft: -40, marginRight: -40 }}>
        <Timeline
          entries={todayEntries}
          companies={companies}
          onRangeSelect={times => setPrefilledTimes(times)}
          onBlockMove={handleBlockMove}
          date={new Date()}
        />
      </div>

      {showModal && (
        <ManualEntryModal companies={companies}
          onClose={() => setShowModal(false)}
          onSaved={() => { onDataChange(); setTlVersion(v => v + 1) }}
        />
      )}

      {prefilledTimes && (
        <ManualEntryModal companies={companies} prefilledTimes={prefilledTimes}
          onClose={() => setPrefilledTimes(null)}
          onSaved={() => { onDataChange(); setPrefilledTimes(null); setTlVersion(v => v + 1) }}
        />
      )}
    </div>
  )
}
