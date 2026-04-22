import { useState, useEffect } from 'react'
import { PlusCircle, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { getCompanies, saveCompanies } from '../services/dataService.js'
import { uid } from '../utils/format.js'

export default function SettingsView({ onDataChange }) {
  const [companies, setCompanies] = useState([])
  const [expanded, setExpanded] = useState({})
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyColor, setNewCompanyColor] = useState('#6366f1')
  const [newProjectNames, setNewProjectNames] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setCompanies(getCompanies())
  }, [])

  function persist(updated) {
    setCompanies(updated)
    saveCompanies(updated)
    onDataChange()
  }

  function addCompany() {
    const name = newCompanyName.trim()
    if (!name) return
    persist([
      ...companies,
      { id: uid(), name, color: newCompanyColor, projects: [] },
    ])
    setNewCompanyName('')
    setNewCompanyColor('#6366f1')
  }

  function deleteCompany(id) {
    persist(companies.filter(c => c.id !== id))
    setConfirmDelete(null)
  }

  function updateCompany(id, changes) {
    persist(companies.map(c => (c.id === id ? { ...c, ...changes } : c)))
  }

  function addProject(companyId) {
    const name = (newProjectNames[companyId] ?? '').trim()
    if (!name) return
    persist(
      companies.map(c =>
        c.id === companyId
          ? { ...c, projects: [...c.projects, { id: uid(), name }] }
          : c
      )
    )
    setNewProjectNames(prev => ({ ...prev, [companyId]: '' }))
  }

  function deleteProject(companyId, projectId) {
    persist(
      companies.map(c =>
        c.id === companyId
          ? { ...c, projects: c.projects.filter(p => p.id !== projectId) }
          : c
      )
    )
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
      </div>

      {/* Add company */}
      <section className="section">
        <h2 className="section-title">Unternehmen hinzufügen</h2>
        <div className="settings-add-row">
          <input
            type="text"
            placeholder="Unternehmensname"
            value={newCompanyName}
            onChange={e => setNewCompanyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCompany()}
          />
          <div className="color-picker-wrapper">
            <input
              type="color"
              value={newCompanyColor}
              onChange={e => setNewCompanyColor(e.target.value)}
              title="Farbe wählen"
            />
            <span className="color-preview" style={{ background: newCompanyColor }} />
          </div>
          <button className="btn-primary" onClick={addCompany}>
            <PlusCircle size={16} />
            Hinzufügen
          </button>
        </div>
      </section>

      {/* Company list */}
      <section className="section">
        <h2 className="section-title">Unternehmen & Projekte</h2>

        {companies.length === 0 && (
          <p className="settings-empty">Noch keine Unternehmen angelegt.</p>
        )}

        <ul className="settings-company-list">
          {companies.map(company => (
            <li key={company.id} className="settings-company-item">
              <div className="settings-company-header">
                <button
                  className="settings-expand-btn"
                  onClick={() => toggleExpand(company.id)}
                >
                  {expanded[company.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span
                  className="settings-company-color"
                  style={{ background: company.color }}
                />
                <span className="settings-company-name">{company.name}</span>
                <div className="settings-company-actions">
                  <input
                    type="color"
                    value={company.color}
                    onChange={e => updateCompany(company.id, { color: e.target.value })}
                    title="Farbe ändern"
                    className="settings-color-inline"
                  />
                  {confirmDelete === company.id ? (
                    <>
                      <span className="confirm-text">Wirklich löschen?</span>
                      <button className="btn-danger-sm" onClick={() => deleteCompany(company.id)}>
                        Ja
                      </button>
                      <button className="btn-secondary-sm" onClick={() => setConfirmDelete(null)}>
                        Nein
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-icon-danger"
                      onClick={() => setConfirmDelete(company.id)}
                      title="Unternehmen löschen"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {expanded[company.id] && (
                <div className="settings-projects">
                  <ul className="settings-project-list">
                    {company.projects.map(p => (
                      <li key={p.id} className="settings-project-item">
                        <span>{p.name}</span>
                        <button
                          className="btn-icon-danger"
                          onClick={() => deleteProject(company.id, p.id)}
                          title="Projekt löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="settings-add-project">
                    <input
                      type="text"
                      placeholder="Neues Projekt …"
                      value={newProjectNames[company.id] ?? ''}
                      onChange={e =>
                        setNewProjectNames(prev => ({ ...prev, [company.id]: e.target.value }))
                      }
                      onKeyDown={e => e.key === 'Enter' && addProject(company.id)}
                    />
                    <button className="btn-primary-sm" onClick={() => addProject(company.id)}>
                      <PlusCircle size={14} />
                      Projekt hinzufügen
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
