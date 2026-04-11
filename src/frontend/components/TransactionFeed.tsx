import type { Transaction } from '../types.js'

interface Props {
  transactions: Transaction[]
  connected: boolean
  error: string | null
}

const SERVICE_BADGE: Record<string, string> = {
  search:    'badge-search',
  finance:   'badge-finance',
  inference: 'badge-inference',
}

function badgeClass(service: string) {
  return SERVICE_BADGE[service.toLowerCase()] ?? 'badge-default'
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TransactionFeed({ transactions, connected, error }: Props) {
  return (
    <div className="feed-container">
      <div className="feed-header">
        <span className="feed-title">Transaction Feed</span>
        <span className="feed-count">{transactions.length} txs</span>
      </div>

      {error && <div className="feed-error">{error}</div>}

      <div className="feed-list">
        {transactions.length === 0 ? (
          <div className="feed-empty">
            {connected
              ? 'Waiting for transactions… run the agent to generate traffic.'
              : 'Connecting to live feed…'}
          </div>
        ) : (
          transactions.map((tx) => (
            <div className="feed-row" key={tx.id}>
              <span className={`service-badge ${badgeClass(tx.service)}`}>
                {tx.service}
              </span>
              <span className="feed-query" title={tx.query}>{tx.query}</span>
              <span className="feed-amount">+{tx.amount} USDC</span>
              <span className="feed-time">{formatTime(tx.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
