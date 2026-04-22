import { defaultCompanies, seedDefaultEntries } from '../utils/defaults.js'
import { getCurrentUser } from './authService.js'

const KEYS = {
  companies: 'bb_companies',
  entries: 'bb_entries',
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
export function getCompanies() {
  initIfEmpty()
  return JSON.parse(localStorage.getItem(KEYS.companies)) ?? []
}

// TODO: replace with API call (Supabase / REST)
export function saveCompanies(companies) {
  localStorage.setItem(KEYS.companies, JSON.stringify(companies))
}

// TODO: replace with API call (Supabase / REST)
// Admin receives all entries; regular users only their own.
export function getEntries() {
  initIfEmpty()
  const all = getRawEntries()
  const user = getCurrentUser()
  if (!user) return []
  if (user.role === 'admin') return all
  return all.filter(e => e.userId === user.id)
}

// TODO: replace with API call (Supabase / REST)
export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries))
}

// TODO: replace with API call (Supabase / REST)
export function addEntry(entry) {
  const all = getRawEntries()
  all.push(entry)
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
