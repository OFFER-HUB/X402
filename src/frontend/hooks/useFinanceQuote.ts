import { useState, useCallback } from 'react'
import type { FinanceQuoteResponse, FetchStatus } from '../types.js'

export interface UseFinanceQuoteResult {
  data: FinanceQuoteResponse | null
  status: FetchStatus
  error: string | null
  /** Fetches a real-time quote for the given ticker (e.g. "NVDA") */
  getQuote: (symbol: string) => Promise<FinanceQuoteResponse | null>
}

/**
 * Calls GET /finance/quote?symbol=<ticker> (Stellar MPP Charge, 0.001 USDC per call).
 * The Mppx client must be configured in the consumer to auto-handle 402 responses.
 */
export function useFinanceQuote(baseUrl: string): UseFinanceQuoteResult {
  const [data, setData] = useState<FinanceQuoteResponse | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const getQuote = useCallback(async (symbol: string): Promise<FinanceQuoteResponse | null> => {
    if (!symbol.trim()) return null
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/finance/quote?symbol=${encodeURIComponent(symbol)}`)
      if (res.status === 402) {
        setStatus('error')
        setError('Payment required — wallet not initialized yet, please wait')
        return null
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result: FinanceQuoteResponse = await res.json()
      setData(result)
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  return { data, status, error, getQuote }
}
