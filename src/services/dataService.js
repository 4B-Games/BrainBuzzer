import { defaultCompanies, seedDefaultEntries } from '../utils/defaults.js'

const KEYS = {
  companies: 'bb_companies',
  entries: 'bb_entries',
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
export function getEntries() {
  initIfEmpty()
  return JSON.parse(localStorage.getItem(KEYS.entries)) ?? []
}

// TODO: replace with API call (Supabase / REST)
export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries))
}

// TODO: replace with API call (Supabase / REST)
export function addEntry(entry) {
  const entries = getEntries()
  entries.push(entry)
  saveEntries(entries)
  return entry
}

// TODO: replace with API call (Supabase / REST)
export function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id)
  saveEntries(entries)
}

// TODO: replace with API call (Supabase / REST)
export function updateEntry(id, changes) {
  const entries = getEntries().map(e => (e.id === id ? { ...e, ...changes } : e))
  saveEntries(entries)
}
