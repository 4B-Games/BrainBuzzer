import { useState, useEffect } from 'react'
import { PlusCircle, ChevronDown, ChevronRight, Archive } from 'lucide-react'
import { getActiveCompanies, saveCompanies, getCompanies, archiveCompany, archiveProject } from '../services/dataService.js'
import { uid } from '../utils/format.js'
import EmojiPicker from '../components/EmojiPicker.jsx'

export default function SettingsView({ onDataChange, currentUser }) {
  const isAdmin = currentUser?.role === 'admin'

  const [companies,       setCompanies]       = useState([])
  const [expanded,        setExpanded]        = useState({})
  const [newCompanyName,  setNewCompanyName]  = useState('')
  const [newCompanyColor, setNewCompanyColor] = useState('#6366f1')
  const [newProjectNames, setNewProjectNames] = useState({})
  const [newProjectEmojis,setNewProjectEmojis]= useState({})
  const [confirmArchive,  setConfirmArchive]  = useState(null)

  function load() {
    // Show only active companies + active projects in settings
    setCompanies(getActiveCompanies())
  }

  useEffect(() => { load() }, [])

  function persist(updated) {
    // Merge back into full company list (keeping archived ones)
    const allCompanies = getCompanies()
    const updatedIds   = new Set(updated.map(c => c.id))
    const merged = [
      ...allCompanies.filter(c => c.archived),   // keep archived
      ...updated,                                  // new active state
      ...allCompanies.filter(c => !c.archived && !updatedIds.has(c.id)), // any non-archived not in updated
    ]
    saveCompanies(merged)
    load()
    onDataChange()
  }

  function addCompany() {
    const name = newCompanyName.trim()
    if (!name) return
    const allCompanies = getCompanies()
    saveCompanies([...allCompanies, { id: uid(), name, color: newCompanyColor, projects: [] }])
    setNewCompanyName(''); setNewCompanyColor('#6366f1')
    load(); onDataChange()
  }

  function updateCompanyColor(id, color) {
    const allCompanies = getCompanies().map(c => c.id === id ? { ...c, color } : c)
    saveCompanies(allCompanies); load(); onDataChange()
  }

  function handleArchiveCompany(id) {
    archiveCompany(id)
    setConfirmArchive(null); load(); onDataChange()
  }

  function addProject(companyId) {
    const name = (newProjectNames[companyId] ?? '').trim()
    if (!name) return
    const emoji = newProjectEmojis[companyId] ?? ''
    const allCompanies = getCompanies().map(c =>
      c.id === companyId ? { ...c, projects: [...c.projects, { id: uid(), name, emoji }] } : c
    )
    saveCompanies(allCompanies)
    setNewProjectNames(prev => ({ ...prev, [companyId]: '' }))
    setNewProjectEmojis(prev => ({ ...prev, [companyId]: '' }))
    load(); onDataChange()
  }

  function handleArchiveProject(companyId, projectId) {
    archiveProject(companyId, projectId); load(); onDataChange()
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
        {!isAdmin && (
          <span className="settings-readonly-hint">Nur Admins können Unternehmen und Projekte verwalten.</span>
        )}
      </div>

      {/* Add company */}
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

      {/* Company list (active only) */}
      <section className="section">
        <h2 className="section-title">Aktive Unternehmen & Projekte</h2>

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
                    confirmArchive === company.id ? (
                      <>
                        <span className="confirm-text">Archivieren?</span>
                        <button className="btn-danger-sm" onClick={() => handleArchiveCompany(company.id)}>Ja</button>
                        <button className="btn-secondary-sm" onClick={() => setConfirmArchive(null)}>Nein</button>
                      </>
                    ) : (
                      <button className="btn-icon-archive" onClick={() => setConfirmArchive(company.id)}
                        title="Unternehmen archivieren">
                        <Archive size={15} />
                      </button>
                    )
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
                          <button className="btn-icon-archive" onClick={() => handleArchiveProject(company.id, p.id)}
                            title="Projekt archivieren">
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
    </div>
  )
}
