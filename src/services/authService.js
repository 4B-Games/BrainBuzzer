const DUMMY_USER = {
  id: 'local-user',
  email: 'lokal@app.de',
  role: 'admin',
}

const AUTH_KEY = 'bb_auth'

// TODO: replace with API call (Supabase / REST)
export function getCurrentUser() {
  if (isLoggedIn()) return DUMMY_USER
  return null
}

// TODO: replace with API call (Supabase / REST)
export function login(email, password) {
  console.log('[auth] login attempt', email, password)
  localStorage.setItem(AUTH_KEY, '1')
  return DUMMY_USER
}

// TODO: replace with API call (Supabase / REST)
export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

// TODO: replace with API call (Supabase / REST)
export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === '1'
}
