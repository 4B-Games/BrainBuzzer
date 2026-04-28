import { useState, useEffect, useMemo } from 'react'
import { getEntries, getCompanies, deleteEntry } from '../services/dataService.js'
import { fmtDurationShort, fmtDateInput, fmtTime } from '../utils/format.js'
import EntryList from '../components/EntryList.jsx'
import EditEntryModal from '../components/EditEntryModal.jsx'

function lastWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateLabel(dateStr) {
  const now       = new Date()
  const today     = fmtDateInput(now)
  const yesterday = fmtDateInput(new Date(now.getTime() - 86_400_000))
  if (dateStr === today)     return 'Heute'
  if (dateStr === yesterday) return 'Gestern'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

// Live entry card – updates every second while timer is running
function LiveEntryCard({ liveEntry, companies }) {
  const company = companies.find(c => c.id === liveEntry.companyId)
  const project = company?.projects?.find(p => p.id === liveEntry.projectId)

  return (
    <div className="live-entry-card">
      <span className="live-entry-bar" style={{ background: liveEntry.color }} />
      <div className="live-entry-dot-wrap">
        <span className="live-entry-dot" style={{ background: liveEntry.color }} />
      </div>
      <div className="entry-info">
        <span className="entry-company">{liveEntry.companyName}</span>
        {liveEntry.projectName && (
          <span className="entry-project">
            {liveEntry.projectEmoji ? liveEntry.projectEmoji + ' ' : ''}{liveEntry.projectName}
          </span>
        )}
      </div>
      <div className="entry-meta">
        <span className="entry-time">{fmtTime(liveEntry.start)} – Jetzt</span>
        <span className="entry-duration live-entry-duration">
          {fmtDurationShort(liveEntry.elapsed)}
        </span>
      </div>
      <span className="live-badge">LIVE</span>
    </div>
  )
}

export default function EntriesView({ dataVersion, onDataChange, liveEntry }) {
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

  const liveSeconds  = liveEntry?.elapsed ?? 0
  const totalSeconds = useMemo(
    () => weekEntries.reduce((s, e) => s + e.duration, 0) + liveSeconds,
    [weekEntries, liveSeconds]
  )

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

  const todayStr = fmtDateInput(new Date())

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einträge</h1>
        <span className="today-total">
          Letzte 7 Tage: <strong>{fmtDurationShort(totalSeconds)}</strong>
          {liveEntry && <span className="live-badge-inline"> inkl. laufend</span>}
        </span>
      </div>

      {/* Live entry always at the top of "Heute" */}
      {liveEntry && (
        <section className="section">
          <div className="entries-day-header">
            <h2 className="entries-day-label">Heute</h2>
            <span className="entries-day-total">
              {fmtDurationShort(
                (grouped.find(([d]) => d === todayStr)?.[1] ?? []).reduce((s, e) => s + e.duration, 0) + liveSeconds
              )}
            </span>
          </div>
          <LiveEntryCard liveEntry={liveEntry} companies={companies} />
          {/* Show today's completed entries below the live card (if any) */}
          {grouped.filter(([d]) => d === todayStr).map(([, dayEntries]) => (
            <div key="today-completed" style={{ marginTop: 8 }}>
              <EntryList entries={dayEntries} companies={companies} onDelete={handleDelete} onEdit={setEditingEntry} />
            </div>
          ))}
        </section>
      )}

      {grouped.length === 0 && !liveEntry && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Keine Einträge in den letzten 7 Tagen.
        </p>
      )}

      {grouped
        .filter(([dateStr]) => !(liveEntry && dateStr === todayStr))  // skip today if already shown above
        .map(([dateStr, dayEntries]) => {
          const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0)
          return (
            <section key={dateStr} className="section">
              <div className="entries-day-header">
                <h2 className="entries-day-label">{dateLabel(dateStr)}</h2>
                <span className="entries-day-total">{fmtDurationShort(dayTotal)}</span>
              </div>
              <EntryList entries={dayEntries} companies={companies} onDelete={handleDelete} onEdit={setEditingEntry} />
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
