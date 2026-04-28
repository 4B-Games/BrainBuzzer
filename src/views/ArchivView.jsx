import { useState, useEffect, useMemo } from 'react'
import { RotateCcw, Trash2, Building2, FolderOpen } from 'lucide-react'
import {
  getCompanies,
  unarchiveCompany, unarchiveProject,
  permanentlyDeleteCompany, permanentlyDeleteProject,
  countEntriesForCompany, countEntriesForProject,
} from '../services/dataService.js'

function DeleteConfirm({ label, entryCount, onConfirm, onCancel }) {
  return (
    <div className="archiv-confirm">
      <p className="archiv-confirm-text">
        Wirklich endgültig löschen?
        {entryCount > 0 && (
          <> &nbsp;
            <strong>{entryCount} {entryCount === 1 ? 'Zeiteintrag verliert' : 'Zeiteinträge verlieren'}</strong>
            {' '}die Zuordnung zu „{label}". Die Einträge selbst bleiben erhalten.
          </>
        )}
      </p>
      <div className="archiv-confirm-actions">
        <button className="btn-secondary-sm" onClick={onCancel}>Abbrechen</button>
        <button className="archiv-delete-final-btn" onClick={onConfirm}>
          <Trash2 size={13} /> Endgültig löschen
        </button>
      </div>
    </div>
  )
}

export default function ArchivView({ onDataChange }) {
  const [companies, setCompanies] = useState([])
  const [confirmItem, setConfirmItem] = useState(null)
  // confirmItem = { type: 'company'|'project', companyId, projectId, label, entryCount }

  function load() { setCompanies(getCompanies()) }
  useEffect(() => { load() }, [])

  const archivedCompanies = useMemo(
    () => companies.filter(c => c.archived),
    [companies]
  )

  const archivedProjects = useMemo(() =>
    companies
      .filter(c => !c.archived)
      .flatMap(c => c.projects.filter(p => p.archived).map(p => ({ ...p, company: c }))),
    [companies]
  )

  function handleUnarchiveCompany(id) {
    unarchiveCompany(id); load(); onDataChange()
  }

  function handleUnarchiveProject(companyId, projectId) {
    unarchiveProject(companyId, projectId); load(); onDataChange()
  }

  function startDeleteCompany(company) {
    setConfirmItem({
      type: 'company', companyId: company.id,
      label: company.name,
      entryCount: countEntriesForCompany(company.id),
    })
  }

  function startDeleteProject(company, project) {
    setConfirmItem({
      type: 'project', companyId: company.id, projectId: project.id,
      label: project.name,
      entryCount: countEntriesForProject(project.id),
    })
  }

  function confirmDelete() {
    if (!confirmItem) return
    if (confirmItem.type === 'company') {
      permanentlyDeleteCompany(confirmItem.companyId)
    } else {
      permanentlyDeleteProject(confirmItem.companyId, confirmItem.projectId)
    }
    setConfirmItem(null); load(); onDataChange()
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
            Archivierte Unternehmen und Projekte erscheinen hier.
          </p>
        </div>
      )}

      {/* ── Archivierte Unternehmen ── */}
      {archivedCompanies.length > 0 && (
        <section className="section">
          <h2 className="section-title">Archivierte Unternehmen</h2>
          <ul className="archiv-list">
            {archivedCompanies.map(c => {
              const ec = countEntriesForCompany(c.id)
              const isConfirming = confirmItem?.type === 'company' && confirmItem.companyId === c.id
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
                      <button className="archiv-restore-btn" onClick={() => handleUnarchiveCompany(c.id)}>
                        <RotateCcw size={14} /> Wiederherstellen
                      </button>
                      <button className="archiv-delete-btn" onClick={() => startDeleteCompany(c)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {isConfirming && (
                    <DeleteConfirm
                      label={c.name}
                      entryCount={confirmItem.entryCount}
                      onConfirm={confirmDelete}
                      onCancel={() => setConfirmItem(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Archivierte Projekte ── */}
      {archivedProjects.length > 0 && (
        <section className="section">
          <h2 className="section-title">Archivierte Projekte</h2>
          <ul className="archiv-list">
            {archivedProjects.map(p => {
              const ep = countEntriesForProject(p.id)
              const isConfirming = confirmItem?.type === 'project' && confirmItem.projectId === p.id
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
                      <button className="archiv-restore-btn" onClick={() => handleUnarchiveProject(p.company.id, p.id)}>
                        <RotateCcw size={14} /> Wiederherstellen
                      </button>
                      <button className="archiv-delete-btn" onClick={() => startDeleteProject(p.company, p)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {isConfirming && (
                    <DeleteConfirm
                      label={p.name}
                      entryCount={confirmItem.entryCount}
                      onConfirm={confirmDelete}
                      onCancel={() => setConfirmItem(null)}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
