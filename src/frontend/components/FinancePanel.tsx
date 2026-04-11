import { useState, type FormEvent } from 'react'
import { useFinanceQuote } from '../hooks/index.js'
import type { WalletState } from '../contexts/WalletContext.js'

interface Props {
  baseUrl: string
  wallet:  WalletState
}

const QUICK_SYMBOLS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'BTC-USD']

function fmt(n: number, dec = 2) {
  if (!isFinite(n)) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function FinancePanel({ baseUrl, wallet }: Props) {
  const [symbol, setSymbol] = useState('')
  const { data, status, error, getQuote } = useFinanceQuote(baseUrl)

  const hasUsdc = wallet.usdcBalance && parseFloat(wallet.usdcBalance) > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await getQuote(symbol.trim().toUpperCase())
  }

  const changeClass = data
    ? data.change >= 0 ? 'quote-change-pos' : 'quote-change-neg'
    : ''

  return (
    <div className="two-col">
      {/* ── Input panel ── */}
      <div className="panel">
        <div className="panel-header">
          <span>◉</span>
          <h3>Stock Quote</h3>
          <span className="panel-cost">0.001 USDC / quote</span>
        </div>
        <div className="panel-body">

          {!hasUsdc && (
            <div style={{
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 12,
              color: 'var(--muted-light)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--green)' }}>Payment required</strong> — costs 0.001 USDC via Stellar MPP.
              {' '}Run{' '}
              <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 11 }}>npm run agent</code>
              {' '}to auto-pay and see results.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <input
                type="text"
                placeholder="Ticker (e.g. NVDA)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="btn"
                disabled={status === 'loading' || !symbol.trim()}
              >
                {status === 'loading' ? '…' : 'Quote'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {QUICK_SYMBOLS.map((s) => (
              <button
                key={s}
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => { setSymbol(s); getQuote(s) }}
                disabled={status === 'loading'}
              >
                {s}
              </button>
            ))}
          </div>

          {status === 'loading' && <div className="status-loading">Fetching quote…</div>}

          {status === 'error' && error?.includes('402') && (
            <div className="status-402">
              402 — server requires Stellar MPP payment. Run{' '}
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>npm run agent</code> to auto-pay.
            </div>
          )}
          {status === 'error' && error && !error.includes('402') && (
            <div className="status-error">{error}</div>
          )}

          {data && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {data.name}
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                    {data.symbol} · {data.currency}
                  </span>
                </div>
              </div>
              <div className="quote-grid">
                <div className="quote-item">
                  <div className="quote-item-label">Price</div>
                  <div className="quote-item-value">{fmt(data.price)}</div>
                </div>
                <div className="quote-item">
                  <div className="quote-item-label">Change</div>
                  <div className={`quote-item-value ${changeClass}`}>
                    {data.change >= 0 ? '+' : ''}{fmt(data.change)}{' '}
                    <span style={{ fontSize: 12 }}>
                      ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="quote-item">
                  <div className="quote-item-label">Volume</div>
                  <div className="quote-item-value">{fmt(data.volume, 0)}</div>
                </div>
                <div className="quote-item">
                  <div className="quote-item-label">Market Cap</div>
                  <div className="quote-item-value">{fmt(data.marketCap)}</div>
                </div>
              </div>
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
            <div className="result-url">GET /finance/quote?symbol=&#123;ticker&#125;</div>
            <div className="result-desc">Stellar MPP Charge — 0.001 USDC per request</div>
          </div>
          <div className="result-block">
            <div className="result-title">Data source</div>
            <div className="result-desc">
              Yahoo Finance via <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>yahoo-finance2</code>.
              Free, no API key. Real-time price, change %, volume, market cap.
            </div>
          </div>
          <div className="result-block">
            <div className="result-title">Agent use case</div>
            <div className="result-desc">
              Agents pull live stock prices mid-task. Pay 0.001 USDC per call — no subscriptions,
              no rate limits, no API key management.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
