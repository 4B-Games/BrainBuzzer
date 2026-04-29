import { useState, useEffect } from 'react'
import { PlusCircle, ChevronDown, ChevronRight, Archive } from 'lucide-react'
import { getActiveCompanies, addCompany as _addCo, addProject as _addPr, updateCompanyColor as _updColor, archiveCompany, archiveProject } from '../services/dataService.supabase.js'
import { uid } from '../utils/format.js'
import EmojiPicker from '../components/EmojiPicker.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function SettingsView({ onDataChange, currentUser }) {
  const isAdmin = currentUser?.role === 'admin'

  const [companies,        setCompanies]        = useState([])
  const [expanded,         setExpanded]         = useState({})
  const [newCompanyName,   setNewCompanyName]   = useState('')
  const [newCompanyColor,  setNewCompanyColor]  = useState('#6366f1')
  const [newProjectNames,  setNewProjectNames]  = useState({})
  const [newProjectEmojis, setNewProjectEmojis] = useState({})
  const [confirmDialog,    setConfirmDialog]    = useState(null)

  async function load() { setCompanies(await getActiveCompanies()) }
  useEffect(() => { load() }, [])

  async function addCompany() {
    const name = newCompanyName.trim()
    if (!name) return
    await _addCo({ id: uid(), name, color: newCompanyColor })
    setNewCompanyName(''); setNewCompanyColor('#6366f1')
    load(); onDataChange()
  }

  async function updateCompanyColor(id, color) {
    await _updColor(id, color)
    load(); onDataChange()
  }

  async function doArchiveCompany(id) {
    await archiveCompany(id); setConfirmDialog(null); load(); onDataChange()
  }

  async function doArchiveProject(companyId, projectId) {
    await archiveProject(companyId, projectId); setConfirmDialog(null); load(); onDataChange()
  }

  async function addProject(companyId) {
    const name = (newProjectNames[companyId] ?? '').trim()
    if (!name) return
    const emoji = newProjectEmojis[companyId] ?? ''
    await _addPr(companyId, { id: uid(), name, emoji })
    setNewProjectNames(prev => ({ ...prev, [companyId]: '' }))
    setNewProjectEmojis(prev => ({ ...prev, [companyId]: '' }))
    load(); onDataChange()
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Archive confirmations ──────────────────────────────────────

  function askArchiveCompany(company) {
    setConfirmDialog({
      title: 'Unternehmen archivieren',
      message: `„${company.name}" wird archiviert und aus der aktiven Auswahl entfernt. Bestehende Zeiteinträge bleiben erhalten. Im Menüpunkt Archiv kann es jederzeit wiederhergestellt oder endgültig gelöscht werden.`,
      confirmLabel: 'Archivieren',
      variant: 'warning',
      onConfirm: () => doArchiveCompany(company.id),
    })
  }

  function askArchiveProject(company, project) {
    setConfirmDialog({
      title: 'Projekt archivieren',
      message: `Das Projekt „${project.emoji ? project.emoji + ' ' : ''}${project.name}" (in: ${company.name}) wird archiviert und aus der aktiven Auswahl entfernt. Im Archiv kann es jederzeit wiederhergestellt oder endgültig gelöscht werden.`,
      confirmLabel: 'Archivieren',
      variant: 'warning',
      onConfirm: () => doArchiveProject(company.id, project.id),
    })
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
        {!isAdmin && (
          <span className="settings-readonly-hint">Nur Admins können Unternehmen und Projekte verwalten.</span>
        )}
      </div>

      {isAdmin && (
        <section className="section">
          <h2 className="section-title">Unternehmen hinzufügen</h2>
          <div className="settings-add-row">
            <input type="text" placeholder="Unternehmensname" value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompany()} />
            <div className="color-picker-wrapper">
              <input type="color" value={newCompanyColor} onChange={e => setNewCompanyColor(e.target.value)} />
              <span className="color-preview" style={{ background: newCompanyColor }} />
            </div>
            <button className="btn-primary" onClick={addCompany}>
              <PlusCircle size={16} /> Hinzufügen
            </button>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Aktive Unternehmen &amp; Projekte</h2>

        {companies.length === 0 && (
          <p className="settings-empty">Keine aktiven Unternehmen vorhanden.</p>
        )}

        <ul className="settings-company-list">
          {companies.map(company => (
            <li key={company.id} className="settings-company-item">
              <div className="settings-company-header">
                <button className="settings-expand-btn" onClick={() => toggleExpand(company.id)}>
                  {expanded[company.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span className="settings-company-color" style={{ background: company.color }} />
                <span className="settings-company-name">{company.name}</span>

                <div className="settings-company-actions">
                  {isAdmin && (
                    <input type="color" value={company.color}
                      onChange={e => updateCompanyColor(company.id, e.target.value)}
                      title="Farbe ändern" className="settings-color-inline" />
                  )}
                  {isAdmin && (
                    <button className="btn-icon-archive" title="Unternehmen archivieren"
                      onClick={() => askArchiveCompany(company)}>
                      <Archive size={15} />
                    </button>
                  )}
                </div>
              </div>

              {expanded[company.id] && (
                <div className="settings-projects">
                  <ul className="settings-project-list">
                    {company.projects.map(p => (
                      <li key={p.id} className="settings-project-item">
                        {p.emoji && <span className="settings-project-emoji">{p.emoji}</span>}
                        <span>{p.name}</span>
                        {isAdmin && (
                          <button className="btn-icon-archive" title="Projekt archivieren"
                            onClick={() => askArchiveProject(company, p)}>
                            <Archive size={13} />
                          </button>
                        )}
                      </li>
                    ))}
                    {company.projects.length === 0 && (
                      <li style={{ color: 'var(--text-dim)', fontSize: 12, padding: '4px 0' }}>
                        Keine aktiven Projekte
                      </li>
                    )}
                  </ul>

                  <div className="settings-add-project">
                    <EmojiPicker
                      value={newProjectEmojis[company.id] ?? ''}
                      onChange={e => setNewProjectEmojis(prev => ({ ...prev, [company.id]: e }))}
                    />
                    <input type="text" placeholder="Neues Projekt …"
                      value={newProjectNames[company.id] ?? ''}
                      onChange={e => setNewProjectNames(prev => ({ ...prev, [company.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addProject(company.id)} />
                    <button className="btn-primary-sm" onClick={() => addProject(company.id)}>
                      <PlusCircle size={14} /> Hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

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
