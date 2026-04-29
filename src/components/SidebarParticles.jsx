import { useEffect, useRef } from 'react'

const COLORS = [
  'rgba(124,77,255,',
  'rgba(200,200,200,',
  'rgba(157,113,255,',
  'rgba(180,180,180,',
  'rgba(140,100,255,',
  'rgba(220,220,220,',
]

const SIZES  = [2, 2.5, 1.5, 3, 2, 1.8, 2.2, 1.6, 2.8, 2, 1.5, 2.5, 2, 1.8, 3,
                2.4, 1.6, 2, 2.2, 1.5, 2.8, 2, 1.8, 2.5, 1.6, 2, 2.2, 3]

const OPAS   = [0.5, 0.4, 0.6, 0.35, 0.55, 0.45, 0.5, 0.4, 0.6, 0.35,
                0.55, 0.45, 0.5, 0.4, 0.5, 0.6, 0.4, 0.5, 0.35, 0.55,
                0.45, 0.5, 0.4, 0.6, 0.5, 0.55, 0.4, 0.5]

export default function SidebarParticles() {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    SIZES.forEach((r, i) => {
      const dot      = document.createElement('span')
      const left     = 4 + Math.random() * 88
      const bottom   = Math.random() * 100
      const duration = 1.2 + Math.random() * 1.8  // schneller: 1.2–3s statt 4–10s
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
