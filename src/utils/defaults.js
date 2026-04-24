import { uid } from './format.js'

export const defaultUsers = [
  { id: 'user-admin', name: 'Admin',                  email: 'admin@brainbuzzer.de',    password: 'admin123', role: 'admin' },
  { id: 'user-1',     name: 'Roberto Versino',         email: 'roberto@brainbuzzer.de',  password: 'pass123',  role: 'user'  },
  { id: 'user-2',     name: 'Berenice Wolanski',       email: 'berenice@brainbuzzer.de', password: 'admin123', role: 'admin' },
  { id: 'user-3',     name: 'Eric Wolanski',           email: 'eric@brainbuzzer.de',     password: 'admin123', role: 'admin' },
  { id: 'user-4',     name: 'Fabian Lackhoff',         email: 'fabian@brainbuzzer.de',   password: 'pass123',  role: 'user'  },
  { id: 'user-5',     name: 'Jens Gescher',            email: 'jens@brainbuzzer.de',     password: 'admin123', role: 'admin' },
  { id: 'user-6',     name: 'Julia Sieberg',           email: 'julia@brainbuzzer.de',    password: 'pass123',  role: 'user'  },
  { id: 'user-7',     name: 'Julian Michler',          email: 'julian@brainbuzzer.de',   password: 'pass123',  role: 'user'  },
  { id: 'user-8',     name: 'Samantha De Luca-Thrun',  email: 'samantha@brainbuzzer.de', password: 'pass123',  role: 'user'  },
]

export const defaultCompanies = [
  {
    id: 'company-1',
    name: 'Brain Games GmbH',
    color: '#6366f1',
    projects: [
      { id: 'proj-1a', name: 'App-Entwicklung', emoji: '💻' },
      { id: 'proj-1b', name: 'Marketing',       emoji: '📊' },
    ],
  },
  {
    id: 'company-2',
    name: 'Freelance',
    color: '#10b981',
    projects: [
      { id: 'proj-2a', name: 'Website Relaunch', emoji: '🌐' },
      { id: 'proj-2b', name: 'Beratung',         emoji: '🤝' },
    ],
  },
  {
    id: 'company-3',
    name: 'Intern',
    color: '#f59e0b',
    projects: [
      { id: 'proj-3a', name: 'Administration', emoji: '📋' },
      { id: 'proj-3b', name: 'Weiterbildung',  emoji: '📚' },
    ],
  },
]

export function seedDefaultEntries() {
  const now = new Date()
  const entries = []

  const t1s = new Date(now); t1s.setHours(9, 0, 0, 0)
  const t1e = new Date(now); t1e.setHours(10, 30, 0, 0)
  entries.push({ id: uid(), userId: 'user-1', companyId: 'company-1', projectId: 'proj-1a',
    start: t1s.toISOString(), end: t1e.toISOString(), duration: 90 * 60, note: 'Projekt-Setup' })

  const t2s = new Date(now); t2s.setHours(11, 0, 0, 0)
  const t2e = new Date(now); t2e.setHours(12, 15, 0, 0)
  entries.push({ id: uid(), userId: 'user-2', companyId: 'company-2', projectId: 'proj-2a',
    start: t2s.toISOString(), end: t2e.toISOString(), duration: 75 * 60, note: '' })

  const yd = new Date(now); yd.setDate(yd.getDate() - 1)
  const y1s = new Date(yd); y1s.setHours(8, 30, 0, 0)
  const y1e = new Date(yd); y1e.setHours(11, 0, 0, 0)
  entries.push({ id: uid(), userId: 'user-1', companyId: 'company-1', projectId: 'proj-1b',
    start: y1s.toISOString(), end: y1e.toISOString(), duration: 150 * 60, note: 'Newsletter' })

  const y2s = new Date(yd); y2s.setHours(13, 0, 0, 0)
  const y2e = new Date(yd); y2e.setHours(15, 30, 0, 0)
  entries.push({ id: uid(), userId: 'user-3', companyId: 'company-3', projectId: 'proj-3b',
    start: y2s.toISOString(), end: y2e.toISOString(), duration: 150 * 60, note: 'Online-Kurs' })

  return entries
}
