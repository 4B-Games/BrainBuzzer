import { defaultCompanies, seedDefaultEntries } from '../utils/defaults.js'
import { getCurrentUser } from './authService.js'

const KEYS = {
  companies: 'bb_companies',
  entries:   'bb_entries',
}

function getRawEntries() {
  return JSON.parse(localStorage.getItem(KEYS.entries)) ?? []
}

function initIfEmpty() {
  if (!localStorage.getItem(KEYS.companies)) {
    localStorage.setItem(KEYS.companies, JSON.stringify(defaultCompanies))
  }
  if (!localStorage.getItem(KEYS.entries)) {
    localStorage.setItem(KEYS.entries, JSON.stringify(seedDefaultEntries()))
  }
}

// TODO: replace with API call (Supabase / REST)
/** All companies incl. archived – used for historical display in reports/timeline */
export function getCompanies() {
  initIfEmpty()
  return JSON.parse(localStorage.getItem(KEYS.companies)) ?? []
}

// TODO: replace with API call (Supabase / REST)
/** Only active (non-archived) companies + their active projects – used for timer/entry selection */
export function getActiveCompanies() {
  return getCompanies()
    .filter(c => !c.archived)
    .map(c => ({ ...c, projects: c.projects.filter(p => !p.archived) }))
}

// TODO: replace with API call (Supabase / REST)
export function saveCompanies(companies) {
  localStorage.setItem(KEYS.companies, JSON.stringify(companies))
}

// ── Archive / Unarchive ────────────────────────────────────────

// TODO: replace with API call (Supabase / REST)
export function archiveCompany(id) {
  saveCompanies(getCompanies().map(c => c.id === id ? { ...c, archived: true } : c))
}

// TODO: replace with API call (Supabase / REST)
export function unarchiveCompany(id) {
  saveCompanies(getCompanies().map(c => c.id === id ? { ...c, archived: false } : c))
}

// TODO: replace with API call (Supabase / REST)
export function archiveProject(companyId, projectId) {
  saveCompanies(getCompanies().map(c => c.id !== companyId ? c : {
    ...c, projects: c.projects.map(p => p.id === projectId ? { ...p, archived: true } : p)
  }))
}

// TODO: replace with API call (Supabase / REST)
export function unarchiveProject(companyId, projectId) {
  saveCompanies(getCompanies().map(c => c.id !== companyId ? c : {
    ...c, projects: c.projects.map(p => p.id === projectId ? { ...p, archived: false } : p)
  }))
}

// ── Permanent deletion ─────────────────────────────────────────

// TODO: replace with API call (Supabase / REST)
/** Permanently deletes a company. Entries lose companyId + projectId (kept as records). */
export function permanentlyDeleteCompany(id) {
  const all = getRawEntries().map(e => e.companyId === id ? { ...e, companyId: null, projectId: null } : e)
  localStorage.setItem(KEYS.entries, JSON.stringify(all))
  saveCompanies(getCompanies().filter(c => c.id !== id))
}

// TODO: replace with API call (Supabase / REST)
/** Permanently deletes a project. Entries lose projectId (kept as records). */
export function permanentlyDeleteProject(companyId, projectId) {
  const all = getRawEntries().map(e => e.projectId === projectId ? { ...e, projectId: null } : e)
  localStorage.setItem(KEYS.entries, JSON.stringify(all))
  saveCompanies(getCompanies().map(c => c.id !== companyId ? c : {
    ...c, projects: c.projects.filter(p => p.id !== projectId)
  }))
}

// ── Entry counts (for deletion warnings) ──────────────────────

// TODO: replace with API call (Supabase / REST)
export function countEntriesForCompany(companyId) {
  return getRawEntries().filter(e => e.companyId === companyId).length
}

// TODO: replace with API call (Supabase / REST)
export function countEntriesForProject(projectId) {
  return getRawEntries().filter(e => e.projectId === projectId).length
}

// ── Entries ────────────────────────────────────────────────────

// TODO: replace with API call (Supabase / REST)
export function getEntries() {
  initIfEmpty()
  const user = getCurrentUser()
  if (!user) return []
  return getRawEntries().filter(e => e.userId === user.id)
}

// TODO: replace with API call (Supabase / REST)
export function getAllEntries() {
  initIfEmpty()
  return getRawEntries()
}

// TODO: replace with API call (Supabase / REST)
export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries))
}

// TODO: replace with API call (Supabase / REST)
export function addEntry(entry) {
  const all = getRawEntries(); all.push(entry)
  localStorage.setItem(KEYS.entries, JSON.stringify(all))
  return entry
}

// TODO: replace with API call (Supabase / REST)
export function deleteEntry(id) {
  localStorage.setItem(KEYS.entries, JSON.stringify(getRawEntries().filter(e => e.id !== id)))
}

// TODO: replace with API call (Supabase / REST)
export function updateEntry(id, changes) {
  localStorage.setItem(KEYS.entries, JSON.stringify(
    getRawEntries().map(e => (e.id === id ? { ...e, ...changes } : e))
  ))
}
