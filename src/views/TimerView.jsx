import { useState, useEffect } from 'react'
import { Play, PlusCircle, Star, X, Pause } from 'lucide-react'
import { getActiveCompanies, getEntries, updateEntry, deleteEntry } from '../services/dataService.supabase.js'
import { getCachedUser } from '../services/authService.supabase.js'
import { getTemplates, saveTemplate, deleteTemplate } from '../services/templateService.js'
import { fmtDuration, isToday } from '../utils/format.js'
import TileGrid from '../components/TileGrid.jsx'
import TimerBanner from '../components/TimerBanner.jsx'
import ManualEntryModal from '../components/ManualEntryModal.jsx'
import Timeline from '../components/Timeline.jsx'

export default function TimerView({
  timerRunning, timerPaused, timerElapsed,
  onTimerStart, onTimerStop, onTimerPause, onTimerResume,
  onDataChange, activeEntry, liveEntry,
}) {
  const [companies,         setCompanies]         = useState([])
  const [todayEntries,      setTodayEntries]       = useState([])
  const [templates,         setTemplates]          = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [note,              setNote]              = useState('')
  const [showModal,         setShowModal]          = useState(false)
  const [prefilledTimes,    setPrefilledTimes]     = useState(null)
  const [tlVersion,         setTlVersion]          = useState(0)

  const user = getCachedUser()

  function loadData() {
    getActiveCompanies().then(cos => setCompanies(cos))
    getEntries().then(all => setTodayEntries(
      all.filter(e => isToday(e.start)).sort((a, b) => new Date(a.start) - new Date(b.start))
    ))
    const u = getCachedUser()
    if (u) setTemplates(getTemplates(u.id) ?? [])
  }

  useEffect(() => { loadData() }, [tlVersion])
  useEffect(() => { if (!timerRunning) setNote('') }, [timerRunning])

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const selectedProject = selectedCompany?.projects.find(p => p.id === selectedProjectId)

  // Check if current selection is already saved as a template
  const isCurrentSaved = templates.some(
    t => t.companyId === selectedCompanyId && (t.projectId ?? null) === (selectedProjectId ?? null)
  )

  // Start only allowed when company is selected AND either company has no projects OR a project is chosen
  const hasProjects = (selectedCompany?.projects.length ?? 0) > 0
  const canStart    = !!selectedCompanyId && (!hasProjects || !!selectedProjectId)

  function handleCompanySelect(id) {
    if (timerRunning) return
    setSelectedCompanyId(id); setSelectedProjectId(null)
  }

  function handleProjectSelect(id) {
    if (timerRunning) return
    setSelectedProjectId(id)
  }

  function startWith(companyId, projectId) {
    const co = companies.find(c => c.id === companyId)
    const pr = co?.projects.find(p => p.id === projectId)
    if (!co) return
    setSelectedCompanyId(companyId)
    setSelectedProjectId(projectId)
    onTimerStart({
      companyId, projectId: projectId ?? null,
      companyName:  co.name,
      companyColor: co.color,
      projectName:  pr?.name ?? '',
      projectEmoji: pr?.emoji ?? '',
      note: '',
    })
  }

  function handleStart() {
    if (!selectedCompanyId) return
    onTimerStart({
      companyId:    selectedCompanyId,
      projectId:    selectedProjectId ?? null,
      companyName:  selectedCompany?.name ?? '',
      companyColor: selectedCompany?.color ?? '#6366f1',
      projectName:  selectedProject?.name ?? '',
      projectEmoji: selectedProject?.emoji ?? '',
      note,
    })
  }

  async function handleSaveTemplate() {
    if (!selectedCompanyId || !user) return
    saveTemplate({ userId: user.id, companyId: selectedCompanyId, projectId: selectedProjectId ?? null })
    setTemplates(getTemplates(user.id) ?? [])
  }

  function handleDeleteTemplate(id) {
    deleteTemplate(id)
    setTemplates(getTemplates(user.id))
  }

  function handleBlockMove(entryId, newStart, newEnd) {
    updateEntry(entryId, { start: newStart, end: newEnd, duration: Math.floor((new Date(newEnd) - new Date(newStart)) / 1000) })
    setTlVersion(v => v + 1); onDataChange()
  }
  async function handleBlockDelete(entryId) { await deleteEntry(entryId); setTlVersion(v => v + 1); onDataChange() }
  function handleBlockUpdate(entryId, { companyId, projectId }) {
    updateEntry(entryId, { companyId, projectId: projectId ?? null })
    setTlVersion(v => v + 1); onDataChange()
  }

  return (
    <>
      <div className="view view--no-bottom">
        <div className="view-header">
          <h1>Timer</h1>
          <button className="btn-secondary" onClick={() => setShowModal(true)}>
            <PlusCircle size={16} /> Manuell erfassen
          </button>
        </div>

        {/* ── Schnellstart-Vorlagen ── */}
        {templates.length > 0 && !timerRunning && (
          <section className="section">
            <h2 className="section-title">Schnellstart</h2>
            <div className="template-list">
              {templates.map(tpl => {
                const co = companies.find(c => c.id === tpl.companyId)
                const pr = co?.projects.find(p => p.id === tpl.projectId)
                if (!co) return null
                return (
                  <div key={tpl.id} className="template-tile">
                    <button
                      className="template-tile-start"
                      onClick={() => startWith(tpl.companyId, tpl.projectId)}
                      style={{ '--tpl-color': co.color }}
                    >
                      <span className="template-tile-dot" style={{ background: co.color }} />
                      <span className="template-tile-co">{co.name}</span>
                      {pr && (
                        <span className="template-tile-pr">
                          {pr.emoji ? pr.emoji + ' ' : ''}{pr.name}
                        </span>
                      )}
                      <Play size={14} className="template-tile-play" fill="currentColor" />
                    </button>
                    <button className="template-tile-remove" onClick={() => handleDeleteTemplate(tpl.id)} title="Vorlage entfernen">
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {timerRunning && activeEntry && (
          <>
            <TimerBanner activeEntry={{ ...activeEntry, elapsed: timerElapsed }} onStop={onTimerStop} />
            <div className="timer-running-display" style={{ paddingTop: 16, paddingBottom: 8 }}>
              <div className="timer-clock" style={{ color: activeEntry?.companyColor }}>
                {fmtDuration(timerElapsed)}
              </div>
              <p className="timer-running-label">
                {activeEntry?.companyName}
                {activeEntry?.projectName
                  ? ` · ${activeEntry.projectEmoji ? activeEntry.projectEmoji + ' ' : ''}${activeEntry.projectName}`
                  : ''}
              </p>
              <div className="timer-action-row">
                <button
                  className={`btn-pause-large${timerPaused ? ' btn-pause-large--resume' : ''}`}
                  onClick={timerPaused ? onTimerResume : onTimerPause}
                >
                  {timerPaused
                    ? <><Play size={16} fill="currentColor" /> Fortsetzen</>
                    : <><Pause size={16} fill="currentColor" /> Pause</>
                  }
                </button>
                <button className="btn-stop-large" onClick={onTimerStop}>
                  ■ &nbsp;Stoppen
                </button>
              </div>
            </div>
          </>
        )}

        <p className="section-title" style={{ marginBottom: 10, marginTop: timerRunning ? 20 : 0 }}>
          Heutiger Zeitstrahl
        </p>
      </div>

      <div className="today-tl-full">
        <Timeline
          entries={todayEntries}
          companies={companies}
          onRangeSelect={times => setPrefilledTimes(times)}
          onBlockMove={handleBlockMove}
          onBlockDelete={handleBlockDelete}
          onBlockUpdate={handleBlockUpdate}
          liveEntry={liveEntry}
          date={new Date()}
        />
      </div>

      <div className="view view--no-top">
        {!timerRunning && (
          <>
            <section className="section">
              <h2 className="section-title">Unternehmen wählen</h2>
              <TileGrid items={companies} selected={selectedCompanyId} onSelect={handleCompanySelect}
                emptyText="Noch keine Unternehmen – bitte in den Einstellungen anlegen." />
            </section>

            {selectedCompany?.projects.length > 0 && (
              <section className="section">
                <h2 className="section-title">Projekt wählen</h2>
                <TileGrid
                  items={selectedCompany.projects.map(p => ({ ...p, color: selectedCompany.color }))}
                  selected={selectedProjectId}
                  onSelect={handleProjectSelect}
                />
              </section>
            )}

            {selectedCompanyId && (
              <section className="section">
                <div className="timer-actions">
                  <input className="note-input" type="text" placeholder="Optionale Notiz …"
                    value={note} onChange={e => setNote(e.target.value)} />
                  {!isCurrentSaved && (
                    <button className="btn-template-save" onClick={handleSaveTemplate} title="Als Schnellstart-Vorlage speichern">
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    className={`btn-start${canStart ? '' : ' btn-start--disabled'}`}
                    onClick={canStart ? handleStart : undefined}
                    disabled={!canStart}
                    style={{ background: canStart ? selectedCompany?.color : undefined }}
                    title={!canStart && hasProjects ? 'Bitte zuerst ein Projekt wählen' : undefined}
                  >
                    <Play size={18} fill="currentColor" />
                    {!canStart && hasProjects ? 'Projekt wählen' : 'Starten'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ManualEntryModal companies={companies}
          onClose={() => setShowModal(false)}
          onSaved={() => { onDataChange(); setTlVersion(v => v + 1) }} />
      )}

      {prefilledTimes && (
        <ManualEntryModal companies={companies} prefilledTimes={prefilledTimes}
          onClose={() => setPrefilledTimes(null)}
          onSaved={() => { onDataChange(); setPrefilledTimes(null); setTlVersion(v => v + 1) }} />
      )}
    </>
  )
}
