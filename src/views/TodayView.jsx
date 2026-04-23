import { useState, useEffect, useMemo } from 'react'
import { getEntries, getCompanies, deleteEntry } from '../services/dataService.js'
import { fmtDurationShort } from '../utils/format.js'
import Timeline from '../components/Timeline.jsx'
import EntryList from '../components/EntryList.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'

function isToday(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

export default function TodayView({ dataVersion, onDataChange }) {
  const [entries, setEntries] = useState([])
  const [companies, setCompanies] = useState([])
  const [prefilledTimes, setPrefilledTimes] = useState(null)

  useEffect(() => {
    setEntries(getEntries())
    setCompanies(getCompanies())
  }, [dataVersion])

  const todayEntries = useMemo(
    () => entries.filter(e => isToday(e.start)).sort((a, b) => new Date(a.start) - new Date(b.start)),
    [entries]
  )

  const totalSeconds = useMemo(
    () => todayEntries.reduce((sum, e) => sum + e.duration, 0),
    [todayEntries]
  )

  function handleDelete(id) {
    deleteEntry(id)
    onDataChange()
  }

  function handleRangeSelect(startISO, endISO) {
    setPrefilledTimes({ start: startISO, end: endISO })
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Heute</h1>
        <span className="today-total">
          Gesamt: <strong>{fmtDurationShort(totalSeconds)}</strong>
        </span>
      </div>

      <section className="section">
        <h2 className="section-title">Zeitstrahl (07:00 – 22:00)</h2>
        <Timeline
          entries={todayEntries}
          companies={companies}
          onRangeSelect={handleRangeSelect}
          date={new Date()}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Einträge</h2>
        <EntryList
          entries={todayEntries}
          companies={companies}
          onDelete={handleDelete}
        />
      </section>

      {prefilledTimes && (
        <ManualEntryModal
          companies={companies}
          prefilledTimes={prefilledTimes}
          onClose={() => setPrefilledTimes(null)}
          onSaved={() => { onDataChange(); setPrefilledTimes(null) }}
        />
      )}
    </div>
  )
}
