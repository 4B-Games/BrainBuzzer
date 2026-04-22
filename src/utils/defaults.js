import { uid } from './format.js'

export const defaultUsers = [
  { id: 'user-admin', name: 'Admin', email: 'admin@brainbuzzer.de', password: 'admin123', role: 'admin' },
  { id: 'user-1',  name: 'Anna Bauer',      email: 'anna@brainbuzzer.de',   password: 'pass123', role: 'user' },
  { id: 'user-2',  name: 'Ben Schulz',       email: 'ben@brainbuzzer.de',    password: 'pass123', role: 'user' },
  { id: 'user-3',  name: 'Clara Meier',      email: 'clara@brainbuzzer.de',  password: 'pass123', role: 'user' },
  { id: 'user-4',  name: 'David König',      email: 'david@brainbuzzer.de',  password: 'pass123', role: 'user' },
  { id: 'user-5',  name: 'Eva Hoffmann',     email: 'eva@brainbuzzer.de',    password: 'pass123', role: 'user' },
  { id: 'user-6',  name: 'Frank Weber',      email: 'frank@brainbuzzer.de',  password: 'pass123', role: 'user' },
  { id: 'user-7',  name: 'Greta Fischer',    email: 'greta@brainbuzzer.de',  password: 'pass123', role: 'user' },
  { id: 'user-8',  name: 'Hans Braun',       email: 'hans@brainbuzzer.de',   password: 'pass123', role: 'user' },
  { id: 'user-9',  name: 'Irene Koch',       email: 'irene@brainbuzzer.de',  password: 'pass123', role: 'user' },
  { id: 'user-10', name: 'Jonas Richter',    email: 'jonas@brainbuzzer.de',  password: 'pass123', role: 'user' },
]

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

  // Heute – user-1
  const t1s = new Date(now); t1s.setHours(9, 0, 0, 0)
  const t1e = new Date(now); t1e.setHours(10, 30, 0, 0)
  entries.push({ id: uid(), userId: 'user-1', companyId: 'company-1', projectId: 'proj-1a',
    start: t1s.toISOString(), end: t1e.toISOString(), duration: 90 * 60, note: 'Projekt-Setup und Planung' })

  // Heute – user-2
  const t2s = new Date(now); t2s.setHours(11, 0, 0, 0)
  const t2e = new Date(now); t2e.setHours(12, 15, 0, 0)
  entries.push({ id: uid(), userId: 'user-2', companyId: 'company-2', projectId: 'proj-2a',
    start: t2s.toISOString(), end: t2e.toISOString(), duration: 75 * 60, note: '' })

  // Gestern – user-1
  const yd = new Date(now); yd.setDate(yd.getDate() - 1)
  const y1s = new Date(yd); y1s.setHours(8, 30, 0, 0)
  const y1e = new Date(yd); y1e.setHours(11, 0, 0, 0)
  entries.push({ id: uid(), userId: 'user-1', companyId: 'company-1', projectId: 'proj-1b',
    start: y1s.toISOString(), end: y1e.toISOString(), duration: 150 * 60, note: 'Newsletter & Social Media' })

  // Gestern – user-3
  const y2s = new Date(yd); y2s.setHours(13, 0, 0, 0)
  const y2e = new Date(yd); y2e.setHours(15, 30, 0, 0)
  entries.push({ id: uid(), userId: 'user-3', companyId: 'company-3', projectId: 'proj-3b',
    start: y2s.toISOString(), end: y2e.toISOString(), duration: 150 * 60, note: 'Online-Kurs' })

  return entries
}
