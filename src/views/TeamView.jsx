import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Download, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { getAllEntries, getCompanies } from '../services/dataService.supabase.js'
import { getUsers } from '../services/authService.supabase.js'
import { fmtDurationShort, fmtDate, fmtDateInput, fmtTime } from '../utils/format.js'
import TeamManagement from '../components/TeamManagement.jsx'

const FILTERS = [
  { id: 'today', label: 'Heute' },
  { id: 'week',  label: 'Diese Woche' },
  { id: 'month', label: 'Dieser Monat' },
  { id: 'all',   label: 'Gesamt' },
]

function getRange(id) {
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
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end:   new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999),
    }
  }
  return { start: new Date(0), end: new Date(9999,11,31) }
}

function SortIcon({ field, sortBy, sortDir }) {
  if (sortBy !== field) return <ArrowUpDown size={13} className="sort-icon dim" />
  return sortDir === 'asc'
    ? <ArrowUp size={13} className="sort-icon active" />
    : <ArrowDown size={13} className="sort-icon active" />
}

function TeamOverview({ dataVersion }) {
  const [entries,   setEntries]   = useState([])
  const [companies, setCompanies] = useState([])
  const [filter,    setFilter]    = useState('month')
  const [expanded,  setExpanded]  = useState({})
  const [sortBy,    setSortBy]    = useState('hours')
  const [sortDir,   setSortDir]   = useState('desc')

  const [employees, setEmployees] = useState([])
  useEffect(() => { getUsers().then(us => setEmployees(us.filter(u => u.role !== 'admin'))) }, [])
  const companyMap = useMemo(() => Object.fromEntries(companies.map(c => [c.id, c])), [companies])

  useEffect(() => {
    async function load() {
      setEntries(await getAllEntries())
      setCompanies(await getCompanies())
    }
    load()
  }, [dataVersion])

  const rangeEntries = useMemo(() => {
    const { start, end } = getRange(filter)
    return entries.filter(e => { const d = new Date(e.start); return d >= start && d <= end })
  }, [entries, filter])

  const stats = useMemo(() => employees.map(emp => {
    const ee       = rangeEntries.filter(e => e.userId === emp.id)
    const totalSec = ee.reduce((s, e) => s + e.duration, 0)
    const days     = new Set(ee.map(e => fmtDateInput(new Date(e.start)))).size
    const avgSec   = days > 0 ? totalSec / days : 0

    const byCompany = {}
    ee.forEach(e => { byCompany[e.companyId] = (byCompany[e.companyId] ?? 0) + e.duration })

    const byProject = {}
    ee.forEach(e => {
      const key = `${e.companyId}||${e.projectId ?? ''}`
      if (!byProject[key]) byProject[key] = { companyId: e.companyId, projectId: e.projectId, sec: 0 }
      byProject[key].sec += e.duration
    })

    const last = ee.length ? new Date(Math.max(...ee.map(e => new Date(e.start)))) : null

    // Target comparison (weekly target * weeks in filter)
    const target = emp.weeklyTarget ?? 0
    let targetSec = 0
    if (target > 0 && filter === 'week')  targetSec = target * 3600
    if (target > 0 && filter === 'month') targetSec = target * 4 * 3600

    return {
      user: emp, totalSec, avgSec, days, entryCount: ee.length,
      targetSec,
      byCompany: Object.entries(byCompany)
        .map(([cid, s]) => ({ company: companyMap[cid], sec: s }))
        .filter(x => x.company).sort((a, b) => b.sec - a.sec),
      byProject: Object.values(byProject).sort((a, b) => b.sec - a.sec),
      lastActivity: last,
    }
  }), [employees, rangeEntries, companyMap])

  const sorted = useMemo(() => [...stats].sort((a, b) => {
    let d = 0
    if (sortBy === 'name')    d = a.user.name.localeCompare(b.user.name)
    if (sortBy === 'hours')   d = a.totalSec - b.totalSec
    if (sortBy === 'entries') d = a.entryCount - b.entryCount
    if (sortBy === 'avg')     d = a.avgSec - b.avgSec
    if (sortBy === 'last')    d = (a.lastActivity?.getTime() ?? 0) - (b.lastActivity?.getTime() ?? 0)
    return sortDir === 'asc' ? d : -d
  }), [stats, sortBy, sortDir])

  function handleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const maxSec    = Math.max(...stats.map(s => s.totalSec), 1)
  const totalTeam = stats.reduce((s, x) => s + x.totalSec, 0)
  const active    = stats.filter(s => s.entryCount > 0).length
  const totalEnt  = stats.reduce((s, x) => s + x.entryCount, 0)

  function exportCSV() {
    const { start, end } = getRange(filter)
    const rows = [['Mitarbeiter','Datum','Unternehmen','Projekt','Von','Bis','Dauer (h)','Notiz']]
    employees.forEach(emp => {
      entries
        .filter(e => e.userId === emp.id && (() => { const d = new Date(e.start); return d >= start && d <= end })())
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .forEach(e => {
          const co = companyMap[e.companyId]
          const pr = co?.projects.find(p => p.id === e.projectId)
          rows.push([emp.name, fmtDate(e.start), co?.name ?? '', pr ? (pr.emoji ?? '')+' '+pr.name : '', fmtTime(e.start), fmtTime(e.end), (e.duration/3600).toFixed(2), e.note ?? ''])
        })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'}))
    a.download = `team-export-${filter}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div className="filter-bar" style={{ marginBottom:0 }}>
          {FILTERS.map(f => (
            <button key={f.id} className={`filter-btn${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <button className="btn-secondary" onClick={exportCSV}><Download size={15}/> CSV</button>
      </div>

      <div className="team-stats-row">
        <div className="team-stat-card">
          <span className="team-stat-label">Team-Stunden</span>
          <span className="team-stat-value">{fmtDurationShort(totalTeam)}</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-label">Aktive Mitarbeiter</span>
          <span className="team-stat-value">{active} / {employees.length}</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-label">Ø pro Person</span>
          <span className="team-stat-value">{fmtDurationShort(active > 0 ? totalTeam / active : 0)}</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-label">Gesamt-Einträge</span>
          <span className="team-stat-value">{totalEnt}</span>
        </div>
      </div>

      <div className="team-table-wrap">
        <table className="team-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('name')}>Mitarbeiter <SortIcon field="name" sortBy={sortBy} sortDir={sortDir} /></th>
              <th className="sortable" onClick={() => handleSort('hours')}>Stunden <SortIcon field="hours" sortBy={sortBy} sortDir={sortDir} /></th>
              <th className="sortable" onClick={() => handleSort('avg')}>Ø / Tag <SortIcon field="avg" sortBy={sortBy} sortDir={sortDir} /></th>
              <th className="sortable" onClick={() => handleSort('entries')}>Einträge <SortIcon field="entries" sortBy={sortBy} sortDir={sortDir} /></th>
              <th className="sortable" onClick={() => handleSort('last')}>Zuletzt aktiv <SortIcon field="last" sortBy={sortBy} sortDir={sortDir} /></th>
              <th>Unternehmen</th>
              <th style={{ width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <>
                <tr key={s.user.id}
                  className={`team-row${s.entryCount === 0 ? ' inactive' : ''}`}
                  onClick={() => s.entryCount > 0 && setExpanded(p => ({ ...p, [s.user.id]: !p[s.user.id] }))}
                >
                  <td className="team-name-cell">
                    <span className="team-avatar" style={{ background: s.user.color ?? 'var(--accent)' }}>
                      {s.user.name[0]}
                    </span>
                    <div>
                      <div>{s.user.name}</div>
                      {s.user.department && <div style={{ fontSize:11, color:'var(--text-dim)' }}>{s.user.department}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="team-hours-cell">
                      <span>{fmtDurationShort(s.totalSec)}</span>
                      <div className="team-bar-bg">
                        <div className="team-bar-fill" style={{ width: `${(s.totalSec / maxSec) * 100}%` }} />
                      </div>
                      {s.targetSec > 0 && (
                        <span style={{ fontSize:11, color: s.totalSec >= s.targetSec ? 'var(--success)' : 'var(--text-dim)' }}>
                          {Math.round((s.totalSec / s.targetSec) * 100)}% vom Ziel
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{s.entryCount > 0 ? fmtDurationShort(s.avgSec) : '—'}</td>
                  <td>{s.entryCount}</td>
                  <td>{s.lastActivity ? fmtDate(s.lastActivity) : <span className="dim">—</span>}</td>
                  <td>
                    <div className="team-dots">
                      {s.byCompany.map(({ company }) => (
                        <span key={company.id} className="team-dot" style={{ background: company.color }} title={company.name} />
                      ))}
                    </div>
                  </td>
                  <td>{s.entryCount > 0 ? expanded[s.user.id] ? <ChevronDown size={16}/> : <ChevronRight size={16}/> : null}</td>
                </tr>

                {expanded[s.user.id] && (
                  <tr key={`${s.user.id}-d`} className="team-detail-row">
                    <td colSpan={7}>
                      <div className="team-detail-wrap">
                        <table className="team-detail-table">
                          <thead><tr><th>Unternehmen</th><th>Projekt</th><th>Stunden</th><th>Anteil</th></tr></thead>
                          <tbody>
                            {s.byProject.map(({ companyId, projectId, sec }, i) => {
                              const co = companyMap[companyId]
                              const pr = co?.projects.find(p => p.id === projectId)
                              return (
                                <tr key={i}>
                                  <td><span className="team-co-dot" style={{ background: co?.color }}/>{co?.name ?? '—'}</td>
                                  <td>{pr ? `${pr.emoji ?? ''} ${pr.name}`.trim() : <span className="dim">Kein Projekt</span>}</td>
                                  <td><strong>{fmtDurationShort(sec)}</strong></td>
                                  <td>
                                    <div className="detail-bar-bg">
                                      <div className="detail-bar-fill" style={{ width: `${(sec/s.totalSec)*100}%`, background: co?.color ?? 'var(--accent)' }}/>
                                    </div>
                                    <span className="dim">{Math.round((sec/s.totalSec)*100)}%</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function TeamView({ dataVersion }) {
  const [tab, setTab] = useState('overview')

  return (
    <div className="view">
      <div className="view-header">
        <h1>Team</h1>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          Übersicht
        </button>
        <button className={`tab-btn${tab === 'manage' ? ' active' : ''}`} onClick={() => setTab('manage')}>
          Verwaltung
        </button>
      </div>

      {tab === 'overview' && <TeamOverview dataVersion={dataVersion} />}
      {tab === 'manage'   && <TeamManagement dataVersion={dataVersion} />}
    </div>
  )
}
