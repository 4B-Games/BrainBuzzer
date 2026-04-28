import { useState, useEffect, useMemo } from 'react'
import { RotateCcw, Trash2, Building2, FolderOpen } from 'lucide-react'
import {
  getCompanies,
  unarchiveCompany, unarchiveProject,
  permanentlyDeleteCompany, permanentlyDeleteProject,
  countEntriesForCompany, countEntriesForProject,
} from '../services/dataService.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function ArchivView({ onDataChange }) {
  const [companies,     setCompanies]     = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  function load() { setCompanies(getCompanies()) }
  useEffect(() => { load() }, [])

  const archivedCompanies = useMemo(() => companies.filter(c => c.archived), [companies])

  const archivedProjects = useMemo(() =>
    companies
      .filter(c => !c.archived)
      .flatMap(c => c.projects.filter(p => p.archived).map(p => ({ ...p, company: c }))),
    [companies]
  )

  function handleUnarchiveCompany(company) {
    setConfirmDialog({
      title: 'Unternehmen wiederherstellen',
      message: `„${company.name}" wird aus dem Archiv geholt und erscheint wieder in der aktiven Auswahl beim Erfassen von Zeiten.`,
      confirmLabel: 'Wiederherstellen',
      variant: 'warning',
      onConfirm: () => { unarchiveCompany(company.id); setConfirmDialog(null); load(); onDataChange() },
    })
  }

  function handleUnarchiveProject(project) {
    setConfirmDialog({
      title: 'Projekt wiederherstellen',
      message: `„${project.emoji ? project.emoji + ' ' : ''}${project.name}" wird wiederhergestellt und erscheint wieder in der aktiven Projektauswahl unter „${project.company.name}".`,
      confirmLabel: 'Wiederherstellen',
      variant: 'warning',
      onConfirm: () => { unarchiveProject(project.company.id, project.id); setConfirmDialog(null); load(); onDataChange() },
    })
  }

  function handleDeleteCompany(company) {
    const count = countEntriesForCompany(company.id)
    const entryText = count > 0
      ? ` ${count} ${count === 1 ? 'Zeiteintrag verliert' : 'Zeiteinträge verlieren'} die Unternehmenszuordnung – die Einträge selbst bleiben erhalten.`
      : ' Es sind keine Zeiteinträge mit diesem Unternehmen verknüpft.'
    setConfirmDialog({
      title: 'Unternehmen endgültig löschen',
      message: `„${company.name}" wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.${entryText}`,
      confirmLabel: 'Endgültig löschen',
      variant: 'danger',
      onConfirm: () => { permanentlyDeleteCompany(company.id); setConfirmDialog(null); load(); onDataChange() },
    })
  }

  function handleDeleteProject(project) {
    const count = countEntriesForProject(project.id)
    const entryText = count > 0
      ? ` ${count} ${count === 1 ? 'Zeiteintrag verliert' : 'Zeiteinträge verlieren'} die Projektzuordnung – die Einträge selbst bleiben erhalten.`
      : ' Es sind keine Zeiteinträge mit diesem Projekt verknüpft.'
    setConfirmDialog({
      title: 'Projekt endgültig löschen',
      message: `„${project.emoji ? project.emoji + ' ' : ''}${project.name}" wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.${entryText}`,
      confirmLabel: 'Endgültig löschen',
      variant: 'danger',
      onConfirm: () => { permanentlyDeleteProject(project.company.id, project.id); setConfirmDialog(null); load(); onDataChange() },
    })
  }

  const isEmpty = archivedCompanies.length === 0 && archivedProjects.length === 0

  return (
    <div className="view">
      <div className="view-header">
        <h1>Archiv</h1>
      </div>

      {isEmpty && (
        <div className="archiv-empty">
          <FolderOpen size={40} />
          <p>Das Archiv ist leer.</p>
          <p className="archiv-empty-sub">
            Archivierte Unternehmen und Projekte erscheinen hier und können wiederhergestellt oder endgültig gelöscht werden.
          </p>
        </div>
      )}

      {archivedCompanies.length > 0 && (
        <section className="section">
          <h2 className="section-title">Archivierte Unternehmen</h2>
          <ul className="archiv-list">
            {archivedCompanies.map(c => {
              const ec = countEntriesForCompany(c.id)
              return (
                <li key={c.id} className="archiv-item">
                  <div className="archiv-item-header">
                    <span className="archiv-color-dot" style={{ background: c.color }} />
                    <div className="archiv-item-info">
                      <span className="archiv-item-name">{c.name}</span>
                      <span className="archiv-item-meta">
                        <Building2 size={12} />
                        {c.projects.length} {c.projects.length === 1 ? 'Projekt' : 'Projekte'}
                        &nbsp;·&nbsp;
                        {ec} {ec === 1 ? 'Zeiteintrag' : 'Zeiteinträge'}
                      </span>
                      {c.projects.length > 0 && (
                        <span className="archiv-item-projects">
                          {c.projects.map(p => `${p.emoji ?? ''} ${p.name}`.trim()).join(' · ')}
                        </span>
                      )}
                    </div>
                    <div className="archiv-item-actions">
                      <button className="archiv-restore-btn" onClick={() => handleUnarchiveCompany(c)}>
                        <RotateCcw size={14} /> Wiederherstellen
                      </button>
                      <button className="archiv-delete-btn" title="Endgültig löschen" onClick={() => handleDeleteCompany(c)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {archivedProjects.length > 0 && (
        <section className="section">
          <h2 className="section-title">Archivierte Projekte</h2>
          <ul className="archiv-list">
            {archivedProjects.map(p => {
              const ep = countEntriesForProject(p.id)
              return (
                <li key={p.id} className="archiv-item">
                  <div className="archiv-item-header">
                    <span className="archiv-color-dot" style={{ background: p.company.color }} />
                    <div className="archiv-item-info">
                      <span className="archiv-item-name">
                        {p.emoji ? p.emoji + ' ' : ''}{p.name}
                      </span>
                      <span className="archiv-item-meta">
                        in: <strong>{p.company.name}</strong>
                        &nbsp;·&nbsp;
                        {ep} {ep === 1 ? 'Zeiteintrag' : 'Zeiteinträge'}
                      </span>
                    </div>
                    <div className="archiv-item-actions">
                      <button className="archiv-restore-btn" onClick={() => handleUnarchiveProject(p)}>
                        <RotateCcw size={14} /> Wiederherstellen
                      </button>
                      <button className="archiv-delete-btn" title="Endgültig löschen" onClick={() => handleDeleteProject(p)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
