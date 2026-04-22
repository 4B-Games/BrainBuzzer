import { uid } from './format.js'

export const defaultCompanies = [
  {
    id: 'company-1',
    name: 'Brain Games GmbH',
    color: '#6366f1',
    projects: [
      { id: 'proj-1a', name: 'App-Entwicklung' },
      { id: 'proj-1b', name: 'Marketing' },
    ],
  },
  {
    id: 'company-2',
    name: 'Freelance',
    color: '#10b981',
    projects: [
      { id: 'proj-2a', name: 'Website Relaunch' },
      { id: 'proj-2b', name: 'Beratung' },
    ],
  },
  {
    id: 'company-3',
    name: 'Intern',
    color: '#f59e0b',
    projects: [
      { id: 'proj-3a', name: 'Administration' },
      { id: 'proj-3b', name: 'Weiterbildung' },
    ],
  },
]

export function seedDefaultEntries() {
  const now = new Date()
  const entries = []

  // Today: two entries
  const t1Start = new Date(now)
  t1Start.setHours(9, 0, 0, 0)
  const t1End = new Date(now)
  t1End.setHours(10, 30, 0, 0)
  entries.push({
    id: uid(),
    userId: 'local-user',
    companyId: 'company-1',
    projectId: 'proj-1a',
    start: t1Start.toISOString(),
    end: t1End.toISOString(),
    duration: 90 * 60,
    note: 'Projekt-Setup und Planung',
  })

  const t2Start = new Date(now)
  t2Start.setHours(11, 0, 0, 0)
  const t2End = new Date(now)
  t2End.setHours(12, 15, 0, 0)
  entries.push({
    id: uid(),
    userId: 'local-user',
    companyId: 'company-2',
    projectId: 'proj-2a',
    start: t2Start.toISOString(),
    end: t2End.toISOString(),
    duration: 75 * 60,
    note: '',
  })

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const y1Start = new Date(yesterday)
  y1Start.setHours(8, 30, 0, 0)
  const y1End = new Date(yesterday)
  y1End.setHours(11, 0, 0, 0)
  entries.push({
    id: uid(),
    userId: 'local-user',
    companyId: 'company-1',
    projectId: 'proj-1b',
    start: y1Start.toISOString(),
    end: y1End.toISOString(),
    duration: 150 * 60,
    note: 'Newsletter & Social Media',
  })

  return entries
}
