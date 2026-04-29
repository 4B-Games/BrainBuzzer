import { useEffect, useRef } from 'react'

const COLORS = [
  'rgba(124,77,255,',   // brand purple
  'rgba(157,113,255,',  // lighter purple
  'rgba(180,130,255,',  // soft purple
  'rgba(200,160,255,',  // very light purple
  'rgba(100,60,220,',   // deep purple
  'rgba(220,200,255,',  // near white purple
]

// Bigger particles for more visibility
const SIZES  = [3, 4, 2.5, 5, 3, 2.8, 3.5, 2.5, 4.5, 3, 2.5, 4, 3, 2.8, 5,
                3.5, 2.5, 3, 3.5, 2.5, 4.5, 3, 2.8, 4, 2.5, 3, 3.5, 5]

// Higher opacity for more prominence
const OPAS   = [0.75, 0.65, 0.80, 0.55, 0.75, 0.65, 0.75, 0.60, 0.80, 0.55,
                0.75, 0.65, 0.75, 0.60, 0.75, 0.80, 0.60, 0.75, 0.55, 0.75,
                0.65, 0.75, 0.60, 0.80, 0.75, 0.75, 0.60, 0.75]

export default function SidebarParticles() {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    SIZES.forEach((r, i) => {
      const dot      = document.createElement('span')
      const left     = 4 + Math.random() * 88
      const bottom   = Math.random() * 100
      const duration = 1.2 + Math.random() * 1.8
      const delay    = -Math.random() * duration
      const col      = COLORS[i % COLORS.length]
      const opa      = OPAS[i]

      dot.style.cssText = [
        `width:${r * 2}px`,
        `height:${r * 2}px`,
        `left:${left}%`,
        `bottom:${bottom}%`,
        `background:${col}${opa})`,
        `animation-duration:${duration}s`,
        `animation-delay:${delay}s`,
      ].join(';')

      container.appendChild(dot)
    })

    return () => { container.innerHTML = '' }
  }, [])

  return <div className="sidebar-particles" ref={ref} />
}
