import { useState, useCallback } from 'react'
import type { SearchResponse, FetchStatus } from '../types.js'

export interface UseSearchResult {
  data: SearchResponse | null
  status: FetchStatus
  error: string | null
  /** Returns null on 402 (payment required) — the Mppx client handles the payment automatically */
  search: (query: string) => Promise<SearchResponse | null>
}

/**
 * Calls GET /search?q=<query> (Stellar MPP Charge, 0.01 USDC per call).
 * The Mppx client must be configured in the agent/consumer to auto-handle 402 responses.
 */
export function useSearch(baseUrl: string): UseSearchResult {
  const [data, setData] = useState<SearchResponse | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string): Promise<SearchResponse | null> => {
    if (!query.trim()) return null
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`)
      if (res.status === 402) {
        setStatus('error')
        setError('Payment required (402) — ensure Mppx is configured')
        return null
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result: SearchResponse = await res.json()
      setData(result)
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  return { data, status, error, search }
}
