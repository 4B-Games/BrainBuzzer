import { uid } from '../utils/format.js'

const KEY = 'bb_templates'

function getAll() {
  return JSON.parse(localStorage.getItem(KEY)) ?? []
}

// TODO: replace with API call (Supabase / REST)
export function getTemplates(userId) {
  return getAll().filter(t => t.userId === userId)
}

// TODO: replace with API call (Supabase / REST)
export function saveTemplate({ userId, companyId, projectId }) {
  const all = getAll()
  // prevent exact duplicates
  if (all.some(t => t.userId === userId && t.companyId === companyId && (t.projectId ?? null) === (projectId ?? null))) return
  localStorage.setItem(KEY, JSON.stringify([...all, { id: uid(), userId, companyId, projectId: projectId ?? null }]))
}

// TODO: replace with API call (Supabase / REST)
export function deleteTemplate(id) {
  localStorage.setItem(KEY, JSON.stringify(getAll().filter(t => t.id !== id)))
}
