import { useState, useCallback, useRef } from 'react'
import type {
  SessionOpenResponse,
  SessionRecord,
  SessionSearchResponse,
  SessionCloseResponse,
  FetchStatus,
} from '../types.js'

export interface UseSessionResult {
  session: SessionOpenResponse | null
  status: FetchStatus
  error: string | null
  /** Open a new payment-channel session */
  open: (agentPublicKey: string, depositAmount: string) => Promise<SessionOpenResponse | null>
  /** Search within the current open session (off-chain, 0.01 USDC per query) */
  search: (query: string) => Promise<SessionSearchResponse | null>
  /** Close and settle the current session */
  close: () => Promise<SessionCloseResponse | null>
  /** Fetch latest session state from the server */
  refetch: () => Promise<SessionRecord | null>
}

/**
 * Manages the full lifecycle of an MPP Session:
 *   open → N × search → close/settle
 *
 * Session protocol: 1 on-chain deposit, N off-chain queries, 1 settlement.
 * Cost per query: 0.01 USDC (tracked off-chain).
 */
export function useSession(baseUrl: string): UseSessionResult {
  const [session, setSession] = useState<SessionOpenResponse | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const open = useCallback(async (
    agentPublicKey: string,
    depositAmount: string,
  ): Promise<SessionOpenResponse | null> => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/session/search/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-public-key': agentPublicKey,
          'x-deposit-amount': depositAmount,
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result: SessionOpenResponse = await res.json()
      setSession(result)
      sessionIdRef.current = result.sessionId
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  const search = useCallback(async (query: string): Promise<SessionSearchResponse | null> => {
    const sessionId = sessionIdRef.current
    if (!sessionId) {
      setError('No active session — call open() first')
      return null
    }
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/session/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, q: query }),
      })
      if (res.status === 402) {
        setStatus('error')
        setError('Payment required — wallet not initialized yet, please wait')
        return null
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result: SessionSearchResponse = await res.json()
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  const close = useCallback(async (): Promise<SessionCloseResponse | null> => {
    const sessionId = sessionIdRef.current
    if (!sessionId) {
      setError('No active session to close')
      return null
    }
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/session/search/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result: SessionCloseResponse = await res.json()
      setSession(null)
      sessionIdRef.current = null
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  const refetch = useCallback(async (): Promise<SessionRecord | null> => {
    const sessionId = sessionIdRef.current
    if (!sessionId) return null
    try {
      const res = await fetch(`${baseUrl}/session/search/${sessionId}`)
      if (!res.ok) return null
      return (await res.json()) as SessionRecord
    } catch {
      return null
    }
  }, [baseUrl])

  return { session, status, error, open, search, close, refetch }
}
