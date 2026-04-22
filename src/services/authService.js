import { defaultUsers } from '../utils/defaults.js'

const KEYS = {
  users: 'bb_users',
  session: 'bb_session',
}

function initUsers() {
  if (!localStorage.getItem(KEYS.users)) {
    localStorage.setItem(KEYS.users, JSON.stringify(defaultUsers))
  }
}

// TODO: replace with API call (Supabase / REST)
export function getUsers() {
  initUsers()
  return JSON.parse(localStorage.getItem(KEYS.users)) ?? []
}

// TODO: replace with API call (Supabase / REST)
export function getCurrentUser() {
  const userId = localStorage.getItem(KEYS.session)
  if (!userId) return null
  return getUsers().find(u => u.id === userId) ?? null
}

// TODO: replace with API call (Supabase / REST)
export function login(email, password) {
  initUsers()
  const user = getUsers().find(
    u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  )
  if (!user) return null
  localStorage.setItem(KEYS.session, user.id)
  return user
}

// TODO: replace with API call (Supabase / REST)
export function logout() {
  localStorage.removeItem(KEYS.session)
}

// TODO: replace with API call (Supabase / REST)
export function isLoggedIn() {
  return !!getCurrentUser()
}
