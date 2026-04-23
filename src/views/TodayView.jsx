import { useState, useEffect, useMemo } from 'react'
import { getEntries, getCompanies, deleteEntry, updateEntry } from '../services/dataService.js'
import { fmtDurationShort } from '../utils/format.js'
import Timeline from '../components/Timeline.jsx'
import EntryList from '../components/EntryList.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'
import EditEntryModal from '../components/EditEntryModal.jsx'

function isToday(isoString) {
  const d = new Date(isoString), now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function TodayView({ dataVersion, onDataChange }) {
  const [entries,        setEntries]        = useState([])
  const [companies,      setCompanies]      = useState([])
  const [prefilledTimes, setPrefilledTimes] = useState(null)
  const [editingEntry,   setEditingEntry]   = useState(null)

  useEffect(() => {
    setEntries(getEntries())
    setCompanies(getCompanies())
  }, [dataVersion])

  const todayEntries = useMemo(
    () => entries.filter(e => isToday(e.start)).sort((a, b) => new Date(a.start) - new Date(b.start)),
    [entries]
  )

  const totalSeconds = useMemo(() => todayEntries.reduce((s, e) => s + e.duration, 0), [todayEntries])

  function handleDelete(id) { deleteEntry(id); onDataChange() }

  function handleBlockMove(entryId, newStart, newEnd) {
    updateEntry(entryId, {
      start: newStart, end: newEnd,
      duration: Math.floor((new Date(newEnd) - new Date(newStart)) / 1000),
    })
    onDataChange()
  }

  return (
    <>
      {/* Header – inside the constrained view */}
      <div className="view view--no-bottom">
        <div className="view-header">
          <h1>Heute</h1>
          <span className="today-total">Gesamt: <strong>{fmtDurationShort(totalSeconds)}</strong></span>
        </div>
        <p className="section-title" style={{ marginBottom: 10 }}>Zeitstrahl (00:00 – 24:00)</p>
      </div>

      {/* Full-width timeline – escapes max-width */}
      <div className="today-tl-full">
        <Timeline
          entries={todayEntries}
          companies={companies}
          onRangeSelect={times => setPrefilledTimes(times)}
          onBlockMove={handleBlockMove}
          date={new Date()}
        />
      </div>

      {/* Entry list – back inside the constrained view */}
      <div className="view view--no-top">
        <section className="section">
          <h2 className="section-title">Einträge</h2>
          <EntryList
            entries={todayEntries}
            companies={companies}
            onDelete={handleDelete}
            onEdit={setEditingEntry}
          />
        </section>
      </div>

      {prefilledTimes && (
        <ManualEntryModal companies={companies} prefilledTimes={prefilledTimes}
          onClose={() => setPrefilledTimes(null)}
          onSaved={() => { onDataChange(); setPrefilledTimes(null) }} />
      )}

      {editingEntry && (
        <EditEntryModal entry={editingEntry} companies={companies} isAdmin={false}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { onDataChange(); setEditingEntry(null) }} />
      )}
    </>
  )
}
