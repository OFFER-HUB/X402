import { useState, useEffect } from 'react'
import type { Transaction, Stats, SSEMessage } from '../types.js'

export interface TransactionFeedState {
  transactions: Transaction[]
  stats: Stats | null
  connected: boolean
  error: string | null
}

/**
 * Connects to /dashboard/events SSE stream and delivers live transactions.
 * Reconnects automatically on disconnect.
 */
export function useTransactionFeed(baseUrl: string): TransactionFeedState {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/dashboard/events`)

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    es.onerror = () => {
      setConnected(false)
      setError('SSE connection lost — retrying…')
    }

    es.onmessage = (e: MessageEvent) => {
      const msg: SSEMessage = JSON.parse(e.data)
      if (msg.type === 'init') {
        setTransactions(msg.transactions)
        setStats(msg.stats)
      } else if (msg.type === 'tx') {
        setTransactions((prev) => [msg.transaction, ...prev].slice(0, 100))
        setStats(msg.stats)
      }
      // 'ping' — ignore, just keeps the connection alive
    }

    return () => es.close()
  }, [baseUrl])

  return { transactions, stats, connected, error }
}
