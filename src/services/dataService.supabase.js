/**
 * Supabase data implementation – aktive Implementierung (ersetzt dataService.js)
 * Alle Funktionen sind async.
 */
import { supabase } from './supabaseClient.js'
import { getCachedUser } from './authService.supabase.js'

// ── Mappers ───────────────────────────────────────────────────────

function mapEntry(row) {
  if (!row) return null
  return {
    id:        row.id,
    userId:    row.user_id,
    companyId: row.company_id,
    projectId: row.project_id,
    start:     row.started_at,
    end:       row.ended_at,
    duration:  row.duration_seconds,
    note:      row.note ?? '',
  }
}

function mapCompany(row) {
  return {
    id:       row.id,
    name:     row.name,
    color:    row.color,
    archived: row.archived ?? false,
    projects: (row.projects ?? []).map(p => ({
      id:       p.id,
      name:     p.name,
      emoji:    p.emoji ?? '',
      archived: p.archived ?? false,
    })),
  }
}

// ── Companies ─────────────────────────────────────────────────────

export async function getCompanies() {
  const { data, error } = await supabase.from('companies').select('*, projects(*)').order('name')
  if (error) throw error
  return (data ?? []).map(mapCompany)
}

export async function getActiveCompanies() {
  const { data, error } = await supabase
    .from('companies').select('*, projects(*)')
    .eq('archived', false).order('name')
  if (error) throw error
  return (data ?? []).map(c => ({
    ...mapCompany(c),
    projects: mapCompany(c).projects.filter(p => !p.archived),
  }))
}

export async function addCompany({ id, name, color }) {
  const { error } = await supabase.from('companies').insert({ id, name, color, archived: false })
  if (error) throw error
}

export async function addProject(companyId, { id, name, emoji }) {
  const { error } = await supabase.from('projects').insert({ id, company_id: companyId, name, emoji: emoji || null, archived: false })
  if (error) throw error
}

export async function updateCompanyColor(id, color) {
  const { error } = await supabase.from('companies').update({ color }).eq('id', id)
  if (error) throw error
}

export async function archiveCompany(id) {
  const { error } = await supabase.from('companies').update({ archived: true }).eq('id', id)
  if (error) throw error
}

export async function unarchiveCompany(id) {
  const { error } = await supabase.from('companies').update({ archived: false }).eq('id', id)
  if (error) throw error
}

export async function archiveProject(companyId, projectId) {
  const { error } = await supabase.from('projects').update({ archived: true }).eq('id', projectId)
  if (error) throw error
}

export async function unarchiveProject(companyId, projectId) {
  const { error } = await supabase.from('projects').update({ archived: false }).eq('id', projectId)
  if (error) throw error
}

export async function permanentlyDeleteCompany(id) {
  await supabase.from('time_entries').update({ company_id: null, project_id: null }).eq('company_id', id)
  await supabase.from('projects').delete().eq('company_id', id)
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

export async function permanentlyDeleteProject(companyId, projectId) {
  await supabase.from('time_entries').update({ project_id: null }).eq('project_id', projectId)
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function countEntriesForCompany(companyId) {
  const { count } = await supabase.from('time_entries').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
  return count ?? 0
}

export async function countEntriesForProject(projectId) {
  const { count } = await supabase.from('time_entries').select('id', { count: 'exact', head: true }).eq('project_id', projectId)
  return count ?? 0
}

// ── Entries ────────────────────────────────────────────────────────

export async function getEntries() {
  const { data, error } = await supabase.from('time_entries').select('*').order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEntry)
}

export async function getAllEntries() {
  const { data, error } = await supabase.from('time_entries').select('*').order('started_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEntry)
}

export async function addEntry(entry) {
  const user = getCachedUser()
  const row = {
    id:               entry.id,
    user_id:          entry.userId ?? user?.id,
    company_id:       entry.companyId,
    project_id:       entry.projectId ?? null,
    started_at:       entry.start,
    ended_at:         entry.end,
    duration_seconds: entry.duration,
    note:             entry.note ?? '',
  }
  const { data, error } = await supabase.from('time_entries').insert(row).select().single()
  if (error) throw error
  return mapEntry(data)
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw error
}

export async function updateEntry(id, changes) {
  const row = {}
  if (changes.start      !== undefined) row.started_at       = changes.start
  if (changes.end        !== undefined) row.ended_at         = changes.end
  if (changes.duration   !== undefined) row.duration_seconds = changes.duration
  if (changes.companyId  !== undefined) row.company_id       = changes.companyId
  if (changes.projectId  !== undefined) row.project_id       = changes.projectId
  if (changes.note       !== undefined) row.note             = changes.note
  if (changes.userId     !== undefined) row.user_id          = changes.userId
  const { error } = await supabase.from('time_entries').update(row).eq('id', id)
  if (error) throw error
}

// ── Templates ──────────────────────────────────────────────────────

export async function getTemplates(userId) {
  const { data, error } = await supabase.from('templates').select('*').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, userId: r.user_id, companyId: r.company_id, projectId: r.project_id }))
}

export async function saveTemplate({ userId, companyId, projectId }) {
  const { error } = await supabase.from('templates').insert({ user_id: userId, company_id: companyId, project_id: projectId ?? null })
  if (error && !error.message.includes('duplicate')) throw error
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
}
