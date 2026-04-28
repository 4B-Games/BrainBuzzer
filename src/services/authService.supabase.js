/**
 * Supabase Auth implementation – drop-in replacement for authService.js
 *
 * To switch: change all imports of './authService' → './authService.supabase'
 *
 * Key differences vs localStorage version:
 *  - All functions are async
 *  - Passwords handled by Supabase (no plaintext storage)
 *  - User profile (name, role, etc.) lives in the `profiles` table
 */
import { supabase } from './supabaseClient.js'

// ── Auth ──────────────────────────────────────────────────────────

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return null
  const profile = await _getProfile(data.user.id)
  if (profile?.active === false) {
    await supabase.auth.signOut()
    return 'disabled'
  }
  return _mergeUserProfile(data.user, profile)
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await _getProfile(user.id)
  return _mergeUserProfile(user, profile)
}

export async function isLoggedIn() {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// ── User management (admin only) ──────────────────────────────────

export async function getUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('name')
  if (error) throw error
  return data.map(_mapProfile)
}

export async function addUser({ name, email, password, role, department, weeklyTarget, color, active }) {
  // Create auth user via Admin API (requires service role key on the backend)
  // For now, use Supabase Dashboard or Edge Functions to create users
  // This is a placeholder – real implementation needs a server-side function
  throw new Error('addUser requires a server-side Supabase Edge Function. See supabase/functions/create-user/')
}

export async function updateUser(id, changes) {
  const profileChanges = {}
  if (changes.name         !== undefined) profileChanges.name          = changes.name
  if (changes.role         !== undefined) profileChanges.role          = changes.role
  if (changes.department   !== undefined) profileChanges.department    = changes.department
  if (changes.weeklyTarget !== undefined) profileChanges.weekly_target = changes.weeklyTarget
  if (changes.color        !== undefined) profileChanges.color         = changes.color
  if (changes.active       !== undefined) profileChanges.active        = changes.active

  const { error } = await supabase.from('profiles').update(profileChanges).eq('id', id)
  if (error) throw error
}

export async function deleteUser(id) {
  // Deleting auth users requires service role – use Edge Function
  throw new Error('deleteUser requires a server-side Supabase Edge Function.')
}

// ── Internal helpers ──────────────────────────────────────────────

async function _getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

function _mergeUserProfile(authUser, profile) {
  return {
    id:           authUser.id,
    email:        authUser.email,
    name:         profile?.name          ?? authUser.email,
    role:         profile?.role          ?? 'user',
    department:   profile?.department    ?? '',
    weeklyTarget: profile?.weekly_target ?? 0,
    color:        profile?.color         ?? '#6366f1',
    active:       profile?.active        ?? true,
  }
}

function _mapProfile(row) {
  return {
    id:           row.id,
    email:        row.email ?? '',
    name:         row.name,
    role:         row.role,
    department:   row.department    ?? '',
    weeklyTarget: row.weekly_target ?? 0,
    color:        row.color         ?? '#6366f1',
    active:       row.active        ?? true,
  }
}
