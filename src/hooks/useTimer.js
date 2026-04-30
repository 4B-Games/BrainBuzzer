import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer() {
  const [running,       setRunning]       = useState(false)
  const [paused,        setPaused]        = useState(false)
  const [elapsed,       setElapsed]       = useState(0)
  const [startTime,     setStartTime]     = useState(null)
  const [pausedElapsed, setPausedElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, paused, startTime])

  const start = useCallback(() => {
    const now = Date.now()
    setStartTime(now)
    setElapsed(0)
    setPausedElapsed(0)
    setPaused(false)
    setRunning(true)
    return new Date(now).toISOString()
  }, [])

  const pause = useCallback((currentElapsed) => {
    const e = currentElapsed ?? 0
    setPausedElapsed(e)
    setPaused(true)
  }, [])

  const resume = useCallback((currentPausedElapsed) => {
    const pe = currentPausedElapsed ?? pausedElapsed
    const adjustedStart = Date.now() - pe * 1000
    setStartTime(adjustedStart)
    setPaused(false)
  }, [pausedElapsed])

  const stop = useCallback(() => {
    setRunning(false)
    setPaused(false)
    const endTime   = Date.now()
    const finalElap = elapsed
    return { end: new Date(endTime).toISOString(), duration: finalElap }
  }, [elapsed])

  const reset = useCallback(() => {
    setRunning(false)
    setPaused(false)
    setElapsed(0)
    setStartTime(null)
    setPausedElapsed(0)
  }, [])

  /** Restore a running timer from a saved startISO (e.g. after browser restart) */
  const restoreFrom = useCallback((startISO) => {
    const origStart = new Date(startISO).getTime()
    setStartTime(origStart)
    setElapsed(Math.floor((Date.now() - origStart) / 1000))
    setPausedElapsed(0)
    setPaused(false)
    setRunning(true)
  }, [])

  return { running, paused, elapsed, startTime, start, pause, resume, stop, reset, restoreFrom }
}
