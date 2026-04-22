import { fmtTime } from '../utils/format.js'

const HOUR_START = 7
const HOUR_END = 22
const TOTAL_HOURS = HOUR_END - HOUR_START

function timeToPercent(isoString) {
  const d = new Date(isoString)
  const minutesSinceStart = (d.getHours() - HOUR_START) * 60 + d.getMinutes()
  return Math.max(0, Math.min(100, (minutesSinceStart / (TOTAL_HOURS * 60)) * 100))
}

function durationToPercent(seconds) {
  return Math.min(100, (seconds / (TOTAL_HOURS * 3600)) * 100)
}

export default function Timeline({ entries, companies }) {
  const companyMap = Object.fromEntries(companies.map(c => [c.id, c]))

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

  return (
    <div className="timeline">
      <div className="timeline-track">
        {/* Hour markers */}
        {hours.map(h => (
          <div
            key={h}
            className="timeline-hour"
            style={{ left: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%` }}
          >
            <span className="timeline-hour-label">{String(h).padStart(2, '0')}:00</span>
            <div className="timeline-hour-tick" />
          </div>
        ))}

        {/* Entry blocks */}
        {entries.map(entry => {
          const company = companyMap[entry.companyId]
          const color = company?.color ?? '#6366f1'
          const left = timeToPercent(entry.start)
          const width = durationToPercent(entry.duration)

          return (
            <div
              key={entry.id}
              className="timeline-block"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%`, background: color }}
              title={`${fmtTime(entry.start)} – ${fmtTime(entry.end)}\n${company?.name ?? ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}
