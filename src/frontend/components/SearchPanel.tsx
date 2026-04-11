import { useState, type FormEvent } from 'react'
import { useSearch } from '../hooks/index.js'
import type { WalletState } from '../contexts/WalletContext.js'
import type { SearchResult } from '../types.js'

interface Props {
  baseUrl: string
  wallet:  WalletState
}

const EXAMPLES = ['Stellar MPP micropayments', 'x402 payment protocol', 'AI agent economy']

export function SearchPanel({ baseUrl, wallet }: Props) {
  const [query, setQuery] = useState('')
  const { data, status, error, search } = useSearch(baseUrl)

  const hasUsdc = wallet.usdcBalance && parseFloat(wallet.usdcBalance) > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = await search(query)
    if (result) wallet.refresh()
  }

  return (
    <div className="two-col">
      {/* ── Input panel ── */}
      <div className="panel">
        <div className="panel-header">
          <span>⌕</span>
          <h3>Web Search</h3>
          <span className="panel-cost">0.01 USDC / query</span>
        </div>
        <div className="panel-body">

          {/* Wallet status banner — only when wallet really has 0 USDC */}
          {!hasUsdc && wallet.status !== 'ready' && (
            <div style={{
              background: 'rgba(124,106,247,0.08)',
              border: '1px solid rgba(124,106,247,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 12,
              color: 'var(--muted-light)',
              lineHeight: 1.6,
            }}>
              Provisioning your demo wallet… first query will auto-pay 0.01 USDC via Stellar MPP.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <input
                type="text"
                placeholder="Search query…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="btn"
                disabled={status === 'loading' || !query.trim()}
              >
                {status === 'loading' ? '…' : 'Search'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {EXAMPLES.map((q) => (
              <button
                key={q}
                className="btn btn-outline"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={async () => { setQuery(q); const r = await search(q); if (r) wallet.refresh() }}
                disabled={status === 'loading'}
              >
                {q}
              </button>
            ))}
          </div>

          {status === 'loading' && <div className="status-loading">Searching…</div>}

          {status === 'error' && error && (
            <div className="status-error">{error}</div>
          )}

          {data && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                {data.results.length} results via <strong>{data.source}</strong> · "{data.query}"
              </div>
              {data.results.map((r: SearchResult, i: number) => (
                <div className="result-block" key={i}>
                  <div className="result-title">{r.title}</div>
                  <div className="result-url">{r.url}</div>
                  <div className="result-desc">{r.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Info panel ── */}
      <div className="panel">
        <div className="panel-header">
          <h3>How payment works</h3>
        </div>
        <div className="panel-body">
          <div className="result-block">
            <div className="result-title">Endpoint</div>
            <div className="result-url">GET /search?q=&#123;query&#125;</div>
            <div className="result-desc">Stellar MPP Charge — 0.01 USDC per request</div>
          </div>
          <div className="result-block">
            <div className="result-title">Payment flow</div>
            <div className="result-desc">
              1. Client calls <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>/search</code><br />
              2. Server returns <strong>HTTP 402</strong> + Stellar MPP challenge<br />
              3. Mppx SDK signs a USDC payment from agent wallet<br />
              4. Retry with payment — server responds with results
            </div>
          </div>
          <div className="result-block">
            <div className="result-title">Providers</div>
            <div className="result-desc">
              Brave Search API → Jina AI fallback (no key needed).
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
