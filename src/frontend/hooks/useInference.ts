import { useState, useCallback } from 'react'
import type { InferenceResponse, FetchStatus } from '../types.js'

export interface UseInferenceResult {
  data: InferenceResponse | null
  status: FetchStatus
  error: string | null
  /** Sends a prompt to POST /inference (Stellar MPP Charge, 0.005 USDC per call) */
  infer: (prompt: string, model?: string) => Promise<InferenceResponse | null>
}

/**
 * Calls POST /inference (Stellar MPP Charge, 0.005 USDC per call).
 * The Mppx client must be configured in the consumer to auto-handle 402 responses.
 */
export function useInference(baseUrl: string): UseInferenceResult {
  const [data, setData] = useState<InferenceResponse | null>(null)
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const infer = useCallback(async (
    prompt: string,
    model?: string,
  ): Promise<InferenceResponse | null> => {
    if (!prompt.trim()) return null
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/inference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
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
      const result: InferenceResponse = await res.json()
      setData(result)
      setStatus('success')
      return result
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      return null
    }
  }, [baseUrl])

  return { data, status, error, infer }
}
