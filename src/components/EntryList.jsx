import { Trash2 } from 'lucide-react'
import { fmtTime, fmtDurationShort } from '../utils/format.js'

export default function EntryList({ entries, companies, onDelete }) {
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))

  if (entries.length === 0) {
    return <p className="entry-list-empty">Keine Einträge vorhanden.</p>
  }

  return (
    <ul className="entry-list">
      {entries.map(entry => {
        const company = companyMap[entry.companyId]
        const project = company?.projects.find(p => p.id === entry.projectId)
        return (
          <li key={entry.id} className="entry-item">
            <span
              className="entry-color-bar"
              style={{ background: company?.color ?? '#555' }}
            />
            <div className="entry-info">
              <span className="entry-company">{company?.name ?? '—'}</span>
              {project && <span className="entry-project">{project.name}</span>}
              {entry.note && <span className="entry-note">{entry.note}</span>}
            </div>
            <div className="entry-meta">
              <span className="entry-time">
                {fmtTime(entry.start)} – {fmtTime(entry.end)}
              </span>
              <span className="entry-duration">{fmtDurationShort(entry.duration)}</span>
            </div>
            {onDelete && (
              <button
                className="entry-delete"
                onClick={() => onDelete(entry.id)}
                title="Eintrag löschen"
              >
                <Trash2 size={15} />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
