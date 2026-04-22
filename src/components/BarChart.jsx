import { fmtDurationShort } from '../utils/format.js'

export default function BarChart({ data }) {
  // data: [{ label, value (seconds), color }]
  if (!data || data.length === 0) {
    return <p className="chart-empty">Keine Daten für diesen Zeitraum.</p>
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const BAR_HEIGHT = 28
  const LABEL_WIDTH = 160
  const CHART_WIDTH = 420
  const GAP = 10
  const svgHeight = data.length * (BAR_HEIGHT + GAP) + 20

  return (
    <div className="bar-chart-wrapper">
      <svg
        className="bar-chart"
        viewBox={`0 0 ${LABEL_WIDTH + CHART_WIDTH + 80} ${svgHeight}`}
        aria-label="Stunden pro Unternehmen"
      >
        {data.map((item, i) => {
          const barWidth = (item.value / maxValue) * CHART_WIDTH
          const y = i * (BAR_HEIGHT + GAP)
          return (
            <g key={item.label} transform={`translate(0, ${y})`}>
              {/* Company label */}
              <text
                x={LABEL_WIDTH - 8}
                y={BAR_HEIGHT / 2 + 1}
                textAnchor="end"
                dominantBaseline="middle"
                className="chart-label"
              >
                {item.label}
              </text>
              {/* Background track */}
              <rect
                x={LABEL_WIDTH}
                y={0}
                width={CHART_WIDTH}
                height={BAR_HEIGHT}
                rx={4}
                className="chart-track"
              />
              {/* Value bar */}
              <rect
                x={LABEL_WIDTH}
                y={0}
                width={Math.max(barWidth, 4)}
                height={BAR_HEIGHT}
                rx={4}
                fill={item.color}
              />
              {/* Duration label */}
              <text
                x={LABEL_WIDTH + barWidth + 8}
                y={BAR_HEIGHT / 2 + 1}
                dominantBaseline="middle"
                className="chart-value"
              >
                {fmtDurationShort(item.value)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
