/**
 * Formats seconds to hh:mm:ss
 */
export function fmtDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

/**
 * Formats seconds to a short human-readable string like "1h 23m"
 */
export function fmtDurationShort(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/**
 * Formats an ISO date string or Date object to HH:MM
 */
export function fmtTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formats an ISO date string or Date object to DD.MM.YYYY
 */
export function fmtDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Formats an ISO date string or Date object to YYYY-MM-DD (for input[type=date])
 */
export function fmtDateInput(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Formats an ISO date string or Date object to HH:MM (for input[type=time])
 */
export function fmtTimeInput(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

/**
 * Generates a simple unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Returns true if the ISO string is today */
export function isToday(isoString) {
  const d = new Date(isoString), now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}
