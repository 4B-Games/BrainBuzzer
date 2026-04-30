/**
 * Supabase Auth – aktive Implementierung (ersetzt authService.js)
 */
import { supabase } from './supabaseClient.js'

// Module-level cache so getCachedUser() works synchronously after login
let _cached = null

export function getCachedUser() { return _cached }

// ── Auth ──────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { _cached = null; return null }
  const profile = await _getProfile(user.id)
  _cached = _merge(user, profile)
  return _cached
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return null
  const profile = await _getProfile(data.user.id)
  if (profile?.active === false) { await supabase.auth.signOut(); return 'disabled' }
  _cached = _merge(data.user, profile)
  return _cached
}

export async function logout() {
  _cached = null
  await supabase.auth.signOut()
}

export function isLoggedIn() { return !!_cached }

// ── User management ───────────────────────────────────────────────

export async function getUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(_mapProfile)
}

/**
 * Creates a new user via signUp.
 * NOTE: Disable "Enable email confirmations" in Supabase Dashboard
 *       (Authentication → Email) so users can log in immediately.
 */
export async function addUser({ name, email, password, role, department, weeklyTarget, color, active }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  const { error: pe } = await supabase.from('profiles').upsert({
    id:            data.user.id,
    name,
    role:          role ?? 'user',
    department:    department ?? '',
    weekly_target: parseFloat(weeklyTarget) || 0,
    color:         color ?? '#7c4dff',
    active:        active !== false,
  })
  if (pe) throw pe
  return { id: data.user.id, email, name, role }
}

export async function updateUser(id, changes) {
  const row = {}
  if (changes.name         !== undefined) row.name          = changes.name
  if (changes.role         !== undefined) row.role          = changes.role
  if (changes.department   !== undefined) row.department    = changes.department
  if (changes.weeklyTarget !== undefined) row.weekly_target = changes.weeklyTarget
  if (changes.color        !== undefined) row.color         = changes.color
  if (changes.active       !== undefined) row.active        = changes.active
  if (changes.password     !== undefined) {
    // Password change requires Admin API – update via Dashboard or Edge Function
    console.warn('[auth] Password changes require Supabase Dashboard or Edge Function')
  }
  const { error } = await supabase.from('profiles').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteUser(id) {
  // Full deletion of auth users requires the Supabase Admin API (service role key).
  // We deactivate the profile instead – the user can no longer log in.
  // To permanently remove from Supabase Auth, go to:
  // Dashboard → Authentication → Users → select user → Delete
  await updateUser(id, { active: false })
}

/** Change the currently logged-in user's own password */
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ── Helpers ───────────────────────────────────────────────────────

async function _getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

function _merge(authUser, profile) {
  return {
    id:           authUser.id,
    email:        authUser.email,
    name:         profile?.name          ?? authUser.email,
    role:         profile?.role          ?? 'user',
    department:   profile?.department    ?? '',
    weeklyTarget: profile?.weekly_target ?? 0,
    color:        profile?.color         ?? '#7c4dff',
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
    color:        row.color         ?? '#7c4dff',
    active:       row.active        ?? true,
  }
}
