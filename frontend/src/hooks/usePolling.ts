import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePollingOptions {
  /** poll interval in ms */
  intervalMs?: number
  /** pause when the tab/document is hidden */
  pauseWhenHidden?: boolean
  /** stop polling entirely */
  disabled?: boolean
}

/**
 * Poll an async function on an interval. Pauses when the document is hidden
 * (no WebSockets in Qestia — polling is the state transport).
 * Errors are swallowed into `error` so one failed poll doesn't kill the loop.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  { intervalMs = 4000, pauseWhenHidden = true, disabled = false }: UsePollingOptions = {},
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const tick = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [])

  useEffect(() => {
    if (disabled) return

    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer) return
      void tick()
      timer = setInterval(() => void tick(), intervalMs)
    }

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      if (pauseWhenHidden && document.hidden) {
        stop()
      } else {
        start()
      }
    }

    if (!pauseWhenHidden || !document.hidden) {
      start()
    }

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      stop()
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [tick, intervalMs, pauseWhenHidden, disabled])

  return { data, error, refresh: tick }
}
