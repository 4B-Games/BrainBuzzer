import { useState, useEffect, useRef } from 'react'
import { Play, PlusCircle } from 'lucide-react'
import { useTimer } from '../hooks/useTimer.js'
import { getCompanies, getEntries, addEntry, updateEntry } from '../services/dataService.js'
import { getCurrentUser } from '../services/authService.js'
import { uid, fmtDuration, isToday } from '../utils/format.js'
import TileGrid from '../components/TileGrid.jsx'
import TimerBanner from '../components/TimerBanner.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'
import Timeline from '../components/Timeline.jsx'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendReminder(companyName, projectName) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification('BrainBuzzer – Noch aktiv?', {
    body: `Du arbeitest seit über 2 Stunden an: ${companyName}${projectName ? ' · ' + projectName : ''}`,
    icon: '/favicon.svg',
    tag: 'bb-reminder',
  })
}

export default function TimerView({ onEntryStart, onEntryStop, onDataChange, activeEntry }) {
  const [companies,      setCompanies]      = useState([])
  const [todayEntries,   setTodayEntries]   = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [note,           setNote]           = useState('')
  const [showModal,      setShowModal]      = useState(false)
  const [prefilledTimes, setPrefilledTimes] = useState(null)
  const [timerStart,     setTimerStart]     = useState(null)
  const [tlVersion,      setTlVersion]      = useState(0)   // local refresh counter for timeline
  const notifTimeout = useRef(null)

  const { running, elapsed, start, stop, reset } = useTimer()

  function loadData() {
    const cos = getCompanies()
    setCompanies(cos)
    const all = getEntries()
    setTodayEntries(all.filter(e => isToday(e.start)).sort((a, b) => new Date(a.start) - new Date(b.start)))
  }

  useEffect(() => {
    loadData()
    requestNotificationPermission()
  }, [tlVersion])

  useEffect(() => () => clearTimeout(notifTimeout.current), [])

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
      companyId:    selectedCompanyId,
      companyName:  selectedCompany?.name ?? '',
      companyColor: selectedCompany?.color ?? '#6366f1',
      projectId:    selectedProjectId ?? null,
      projectName:  selectedProject?.name ?? '',
      projectEmoji: selectedProject?.emoji ?? '',
      elapsed: 0,
    })
    clearTimeout(notifTimeout.current)
    notifTimeout.current = setTimeout(
      () => sendReminder(selectedCompany?.name ?? '', selectedProject?.name ?? ''),
      TWO_HOURS_MS
    )
  }

  useEffect(() => {
    if (running && activeEntry) onEntryStart({ ...activeEntry, elapsed })
  }, [elapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStop() {
    clearTimeout(notifTimeout.current)
    const { end, duration } = stop()
    const user = getCurrentUser()
    addEntry({
      id: uid(),
      userId: user?.id ?? 'unknown',
      companyId: selectedCompanyId,
      projectId: selectedProjectId ?? null,
      start: timerStart,
      end, duration, note,
    })
    onEntryStop()
    onDataChange()
    setNote('')
    reset()
    setTlVersion(v => v + 1)
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

      {running && activeEntry && (
        <TimerBanner activeEntry={{ ...activeEntry, elapsed }} onStop={handleStop} />
      )}

      {!running && (
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

      {running && (
        <div className="timer-running-display">
          <div className="timer-clock" style={{ color: selectedCompany?.color }}>
            {fmtDuration(elapsed)}
          </div>
          <p className="timer-running-label">
            {selectedCompany?.name}
            {selectedProject
              ? ` · ${selectedProject.emoji ? selectedProject.emoji + ' ' : ''}${selectedProject.name}`
              : ''}
          </p>
        </div>
      )}

      {/* ── Today's timeline ── */}
      <section className="section">
        <h2 className="section-title">Heutige Einträge – Zeitstrahl</h2>
      </section>

      {/* Full-width timeline – same pattern as TodayView */}
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
