import { useEffect } from 'react'

/**
 * Global keyboard shortcuts for BrainBuzzer.
 * Does not fire when focus is inside an input, select, or textarea.
 */
export function useKeyboardShortcuts({ onStopTimer, onNavigate, onNewEntry, onShowHelp, timerRunning }) {
  useEffect(() => {
    function handle(e) {
      // Never fire inside text inputs
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (timerRunning) onStopTimer?.()
          else onNavigate?.('timer')
          break
        case 'n':
        case 'N':
          e.preventDefault()
          onNewEntry?.()
          break
        case '1': onNavigate?.('timer');    break
        case '2': onNavigate?.('entries');  break
        case '3': onNavigate?.('reports');  break
        case '4': onNavigate?.('settings'); break
        case '?':
          onShowHelp?.()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [timerRunning, onStopTimer, onNavigate, onNewEntry, onShowHelp])
}

export const SHORTCUTS = [
  { key: 'Space',  description: 'Timer stoppen (wenn aktiv) · Timer-Seite öffnen' },
  { key: 'N',      description: 'Zur Timer-Seite (Manuell erfassen)' },
  { key: '1',      description: 'Timer' },
  { key: '2',      description: 'Einträge' },
  { key: '3',      description: 'Berichte' },
  { key: '4',      description: 'Einstellungen' },
  { key: '?',      description: 'Diese Hilfe anzeigen/schließen' },
]
