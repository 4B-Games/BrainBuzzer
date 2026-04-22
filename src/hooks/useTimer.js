import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, startTime])

  const start = useCallback(() => {
    const now = Date.now()
    setStartTime(now)
    setElapsed(0)
    setRunning(true)
    return new Date(now).toISOString()
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    const endTime = Date.now()
    const finalElapsed = Math.floor((endTime - startTime) / 1000)
    setElapsed(finalElapsed)
    return { end: new Date(endTime).toISOString(), duration: finalElapsed }
  }, [startTime])

  const reset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
    setStartTime(null)
  }, [])

  return { running, elapsed, startTime, start, stop, reset }
}
