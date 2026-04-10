import { useState, useEffect, useCallback } from 'react'
import type { Stats, FetchStatus } from '../types.js'

export interface UseStatsResult {
  stats: Stats | null
  status: FetchStatus
  error: string | null
  refetch: () => void
}

/**
 * Fetches current usage stats from GET /stats.
 * Pass `pollIntervalMs` to enable polling (e.g. 5000 for 5s updates).
 */
export function useStats(baseUrl: string, pollIntervalMs?: number): UseStatsResult {
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch(`${baseUrl}/stats`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStats(await res.json())
      setStatus('success')
      setError(null)
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }, [baseUrl])

  useEffect(() => {
    fetch_()
    if (!pollIntervalMs) return
    const id = setInterval(fetch_, pollIntervalMs)
    return () => clearInterval(id)
  }, [fetch_, pollIntervalMs])

  return { stats, status, error, refetch: fetch_ }
}
