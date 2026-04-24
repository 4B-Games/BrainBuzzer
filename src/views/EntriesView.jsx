import { useState, useEffect, useMemo } from 'react'
import { getEntries, getCompanies, deleteEntry } from '../services/dataService.js'
import { fmtDurationShort, fmtDateInput } from '../utils/format.js'
import EntryList from '../components/EntryList.jsx'
import EditEntryModal from '../components/EditEntryModal.jsx'

function lastWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateLabel(dateStr) {
  const now  = new Date()
  const today = fmtDateInput(now)
  const yesterday = fmtDateInput(new Date(now.getTime() - 86_400_000))
  if (dateStr === today)     return 'Heute'
  if (dateStr === yesterday) return 'Gestern'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

export default function EntriesView({ dataVersion, onDataChange }) {
  const [entries,      setEntries]      = useState([])
  const [companies,    setCompanies]    = useState([])
  const [editingEntry, setEditingEntry] = useState(null)

  useEffect(() => {
    setEntries(getEntries())
    setCompanies(getCompanies())
  }, [dataVersion])

  const weekEntries = useMemo(() => {
    const cutoff = lastWeekStart()
    return entries
      .filter(e => new Date(e.start) >= cutoff)
      .sort((a, b) => new Date(b.start) - new Date(a.start))
  }, [entries])

  const totalSeconds = useMemo(() => weekEntries.reduce((s, e) => s + e.duration, 0), [weekEntries])

  const grouped = useMemo(() => {
    const map = {}
    weekEntries.forEach(e => {
      const key = fmtDateInput(new Date(e.start))
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [weekEntries])

  function handleDelete(id) { deleteEntry(id); onDataChange() }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einträge</h1>
        <span className="today-total">
          Letzte 7 Tage: <strong>{fmtDurationShort(totalSeconds)}</strong>
        </span>
      </div>

      {grouped.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Keine Einträge in den letzten 7 Tagen.
        </p>
      )}

      {grouped.map(([dateStr, dayEntries]) => {
        const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0)
        return (
          <section key={dateStr} className="section">
            <div className="entries-day-header">
              <h2 className="entries-day-label">{dateLabel(dateStr)}</h2>
              <span className="entries-day-total">{fmtDurationShort(dayTotal)}</span>
            </div>
            <EntryList
              entries={dayEntries}
              companies={companies}
              onDelete={handleDelete}
              onEdit={setEditingEntry}
            />
          </section>
        )
      })}

      {editingEntry && (
        <EditEntryModal entry={editingEntry} companies={companies} isAdmin={false}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { onDataChange(); setEditingEntry(null) }} />
      )}
    </div>
  )
}
