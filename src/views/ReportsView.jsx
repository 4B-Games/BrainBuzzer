import { useState, useEffect, useMemo, useRef } from 'react'
import { Download, ChevronDown, Users } from 'lucide-react'
import { getEntries, getAllEntries, getCompanies, deleteEntry } from '../services/dataService.js'
import { getUsers } from '../services/authService.js'
import { fmtDate, fmtTime, fmtDurationShort, fmtDateInput } from '../utils/format.js'
import BarChart from '../components/BarChart.jsx'
import EntryList from '../components/EntryList.jsx'
import EditEntryModal from '../components/EditEntryModal.jsx'

// ── Period filter ────────────────────────────────────────────────
const PERIOD_FILTERS = [
  { id: 'today',  label: 'Heute' },
  { id: 'week',   label: 'Diese Woche' },
  { id: 'month',  label: 'Dieser Monat' },
  { id: 'all',    label: 'Gesamt' },
  { id: 'custom', label: 'Zeitraum …' },
]

function getPeriodRange(id, from, to) {
  const now = new Date()
  if (id === 'today') {
    const s = new Date(now); s.setHours(0,0,0,0)
    const e = new Date(now); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (id === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const s = new Date(now); s.setDate(now.getDate() - day); s.setHours(0,0,0,0)
    const e = new Date(now); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (id === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    const e = new Date(now); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (id === 'custom') {
    return {
      start: from ? new Date(`${from}T00:00:00`) : new Date(0),
      end:   to   ? new Date(`${to}T23:59:59`)   : new Date(9999,11,31),
    }
  }
  return { start: new Date(0), end: new Date(9999,11,31) }
}

// ── Employee multi-select ────────────────────────────────────────
function EmployeeMultiSelect({ employees, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function h(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const allSelected = selected.length === 0
  const label = allSelected
    ? `Alle (${employees.length})`
    : selected.length === 1
      ? employees.find(u => u.id === selected[0])?.name ?? '1 ausgewählt'
      : `${selected.length} ausgewählt`

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  return (
    <div className="ms-root" ref={ref}>
      <button className="ms-trigger" onClick={() => setOpen(o => !o)}>
        <Users size={14} />
        <span>{label}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="ms-dropdown">
          <label className="ms-item ms-all">
            <input type="checkbox" checked={allSelected} onChange={() => onChange([])} />
            <span>Alle auswählen</span>
          </label>
          <div className="ms-divider" />
          {employees.map(u => (
            <label key={u.id} className="ms-item">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              <span>{u.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function ReportsView({ dataVersion, currentUser }) {
  const now = new Date()
  const [entries,         setEntries]         = useState([])
  const [companies,       setCompanies]       = useState([])
  const [period,          setPeriod]          = useState('week')
  const [customFrom,      setCustomFrom]      = useState(fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [customTo,        setCustomTo]        = useState(fmtDateInput(now))
  const [filterCompanyId, setFilterCompanyId] = useState('all')
  const [filterProjectId, setFilterProjectId] = useState('all')
  const [filterUserIds,   setFilterUserIds]   = useState([])
  const [editingEntry,    setEditingEntry]    = useState(null)

  const isAdmin    = currentUser?.role === 'admin'
  const employees  = useMemo(() => isAdmin ? getUsers() : [], [isAdmin])

  useEffect(() => {
    setEntries(isAdmin ? getAllEntries() : getEntries())
    setCompanies(getCompanies())
  }, [dataVersion, isAdmin])

  // Reset project filter when company changes
  function handleCompanyChange(id) {
    setFilterCompanyId(id)
    setFilterProjectId('all')
  }

  const availableProjects = useMemo(() => {
    if (filterCompanyId === 'all') return []
    return companies.find(c => c.id === filterCompanyId)?.projects ?? []
  }, [companies, filterCompanyId])

  const filtered = useMemo(() => {
    const range = getPeriodRange(period, customFrom, customTo)
    return entries
      .filter(e => {
        const d = new Date(e.start)
        if (d < range.start || d > range.end) return false
        if (filterCompanyId !== 'all' && e.companyId !== filterCompanyId) return false
        if (filterProjectId !== 'all' && e.projectId !== filterProjectId) return false
        if (filterUserIds.length > 0 && !filterUserIds.includes(e.userId)) return false
        return true
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
  }, [entries, period, customFrom, customTo, filterCompanyId, filterProjectId, filterUserIds])

  const chartData = useMemo(() => {
    const map = {}
    filtered.forEach(e => {
      const co = companies.find(c => c.id === e.companyId)
      if (!co) return
      if (!map[e.companyId]) map[e.companyId] = { label: co.name, value: 0, color: co.color }
      map[e.companyId].value += e.duration
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered, companies])

  const totalSec   = useMemo(() => filtered.reduce((s, e) => s + e.duration, 0), [filtered])
  const totalDays  = useMemo(() => new Set(filtered.map(e => fmtDateInput(new Date(e.start)))).size, [filtered])
  const avgPerDay  = totalDays > 0 ? totalSec / totalDays : 0
  const topCo      = chartData[0]?.label ?? '—'

  function handleDelete(id) {
    deleteEntry(id)
    setEntries(isAdmin ? getAllEntries() : getEntries())
  }

  function handleEditSaved() {
    setEntries(isAdmin ? getAllEntries() : getEntries())
  }

  function handleCsvExport() {
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
    const userMap    = Object.fromEntries(getUsers().map(u => [u.id, u]))
    const rows = [['Datum','Mitarbeiter','Unternehmen','Projekt','Von','Bis','Dauer (h)','Notiz']]
    filtered.forEach(e => {
      const co = companyMap[e.companyId]
      const pr = co?.projects.find(p => p.id === e.projectId)
      rows.push([
        fmtDate(e.start),
        userMap[e.userId]?.name ?? e.userId,
        co?.name ?? '',
        pr ? (pr.emoji ? pr.emoji+' ' : '') + pr.name : '',
        fmtTime(e.start), fmtTime(e.end),
        (e.duration/3600).toFixed(2),
        e.note ?? '',
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'}))
    a.download = `berichte-export-${period}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Berichte</h1>
        <button className="btn-secondary" onClick={handleCsvExport}>
          <Download size={16} /> CSV Export
        </button>
      </div>

      {/* ── Period filter ── */}
      <div className="filter-bar">
        {PERIOD_FILTERS.map(f => (
          <button key={f.id} className={`filter-btn${period === f.id ? ' active' : ''}`}
            onClick={() => setPeriod(f.id)}>{f.label}</button>
        ))}
        <span className="filter-total">
          Gesamt: <strong>{fmtDurationShort(totalSec)}</strong>
        </span>
      </div>

      {period === 'custom' && (
        <div className="custom-range-bar">
          <label className="custom-range-label">Von</label>
          <input type="date" className="custom-range-input" value={customFrom} max={customTo}
            onChange={e => setCustomFrom(e.target.value)} />
          <label className="custom-range-label">Bis</label>
          <input type="date" className="custom-range-input" value={customTo} min={customFrom}
            onChange={e => setCustomTo(e.target.value)} />
        </div>
      )}

      {/* ── Advanced filters ── */}
      <div className="adv-filter-bar">
        {/* Company */}
        <div className="adv-filter-group">
          <label className="adv-filter-label">Unternehmen</label>
          <select className="adv-filter-select" value={filterCompanyId} onChange={e => handleCompanyChange(e.target.value)}>
            <option value="all">Alle Unternehmen</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Project */}
        <div className="adv-filter-group">
          <label className="adv-filter-label">Projekt</label>
          <select className="adv-filter-select" value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            disabled={filterCompanyId === 'all'}
          >
            <option value="all">Alle Projekte</option>
            {availableProjects.map(p => (
              <option key={p.id} value={p.id}>{p.emoji ? p.emoji+' ' : ''}{p.name}</option>
            ))}
          </select>
        </div>

        {/* Employee multi-select (admin only) */}
        {isAdmin && (
          <div className="adv-filter-group">
            <label className="adv-filter-label">Mitarbeiter</label>
            <EmployeeMultiSelect
              employees={employees}
              selected={filterUserIds}
              onChange={setFilterUserIds}
            />
          </div>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="reports-stats-row">
        <div className="reports-stat">
          <span className="reports-stat-label">Zeitraum</span>
          <span className="reports-stat-value">{fmtDurationShort(totalSec)}</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-label">Arbeitstage</span>
          <span className="reports-stat-value">{totalDays}</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-label">Ø pro Tag</span>
          <span className="reports-stat-value">{fmtDurationShort(avgPerDay)}</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-label">Einträge</span>
          <span className="reports-stat-value">{filtered.length}</span>
        </div>
        <div className="reports-stat">
          <span className="reports-stat-label">Top Unternehmen</span>
          <span className="reports-stat-value reports-stat-top">{topCo}</span>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Stunden pro Unternehmen</h2>
        <BarChart data={chartData} />
      </section>

      <section className="section">
        <h2 className="section-title">Einträge im Zeitraum</h2>
        <EntryList
          entries={filtered}
          companies={companies}
          showUser={isAdmin}
          onDelete={isAdmin ? handleDelete : undefined}
          onEdit={isAdmin ? setEditingEntry : undefined}
        />
      </section>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          companies={companies}
          isAdmin={isAdmin}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { handleEditSaved(); setEditingEntry(null) }}
        />
      )}
    </div>
  )
}
