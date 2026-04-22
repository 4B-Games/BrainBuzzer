import { useState, useEffect, useMemo } from 'react'
import { Download } from 'lucide-react'
import { getEntries, getCompanies } from '../services/dataService.js'
import { getUsers } from '../services/authService.js'
import { fmtDate, fmtTime, fmtDurationShort } from '../utils/format.js'
import BarChart from '../components/BarChart.jsx'
import EntryList from '../components/EntryList.jsx'

const FILTERS = [
  { id: 'today', label: 'Heute' },
  { id: 'week',  label: 'Diese Woche' },
  { id: 'month', label: 'Dieser Monat' },
  { id: 'all',   label: 'Gesamt' },
]

function getFilterRange(filterId) {
  const now = new Date()
  if (filterId === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { start: s, end: e }
  }
  if (filterId === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const s = new Date(now); s.setDate(now.getDate() - day); s.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { start: s, end: e }
  }
  if (filterId === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { start: s, end: e }
  }
  return { start: new Date(0), end: new Date(9999, 11, 31) }
}

export default function ReportsView({ dataVersion, currentUser }) {
  const [entries, setEntries] = useState([])
  const [companies, setCompanies] = useState([])
  const [filter, setFilter] = useState('week')
  const [selectedUserId, setSelectedUserId] = useState('all')

  const isAdmin = currentUser?.role === 'admin'
  const employees = useMemo(
    () => isAdmin ? getUsers().filter(u => u.role !== 'admin') : [],
    [isAdmin]
  )

  useEffect(() => {
    setEntries(getEntries())
    setCompanies(getCompanies())
  }, [dataVersion])

  const filtered = useMemo(() => {
    const range = getFilterRange(filter)
    let result = entries.filter(e => {
      const d = new Date(e.start)
      return d >= range.start && d <= range.end
    })
    if (isAdmin && selectedUserId !== 'all') {
      result = result.filter(e => e.userId === selectedUserId)
    }
    return result.sort((a, b) => new Date(a.start) - new Date(b.start))
  }, [entries, filter, isAdmin, selectedUserId])

  const chartData = useMemo(() => {
    const map = {}
    filtered.forEach(e => {
      const company = companies.find(c => c.id === e.companyId)
      if (!company) return
      if (!map[e.companyId]) {
        map[e.companyId] = { label: company.name, value: 0, color: company.color }
      }
      map[e.companyId].value += e.duration
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [filtered, companies])

  const totalSeconds = useMemo(() => filtered.reduce((s, e) => s + e.duration, 0), [filtered])

  function handleCsvExport() {
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))
    const userMap = Object.fromEntries(getUsers().map(u => [u.id, u]))
    const rows = [
      ['Datum', 'Mitarbeiter', 'Unternehmen', 'Projekt', 'Von', 'Bis', 'Dauer (h)', 'Notiz'],
      ...filtered.map(e => {
        const company = companyMap[e.companyId]
        const project = company?.projects.find(p => p.id === e.projectId)
        const user = userMap[e.userId]
        return [
          fmtDate(e.start),
          user?.name ?? e.userId,
          company?.name ?? '',
          project?.name ?? '',
          fmtTime(e.start),
          fmtTime(e.end),
          (e.duration / 3600).toFixed(2),
          e.note ?? '',
        ]
      }),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brainbuzzer-export-${filter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Berichte</h1>
        <button className="btn-secondary" onClick={handleCsvExport}>
          <Download size={16} />
          CSV Export
        </button>
      </div>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="filter-total">
          Gesamt: <strong>{fmtDurationShort(totalSeconds)}</strong>
        </span>
      </div>

      {isAdmin && (
        <div className="user-filter-bar">
          <label className="user-filter-label">Mitarbeiter:</label>
          <select
            className="user-filter-select"
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
          >
            <option value="all">Alle Mitarbeiter</option>
            {employees.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      <section className="section">
        <h2 className="section-title">Stunden pro Unternehmen</h2>
        <BarChart data={chartData} />
      </section>

      <section className="section">
        <h2 className="section-title">Einträge im Zeitraum</h2>
        <EntryList entries={filtered} companies={companies} showUser={isAdmin} />
      </section>
    </div>
  )
}
