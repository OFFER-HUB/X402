import { useState, useCallback } from 'react'
import { useSession } from '../hooks/index.js'
import type { SessionRecord, SessionSearchResponse } from '../types.js'

interface SessionPanelProps {
  baseUrl:          string
  defaultPublicKey?: string
}

function truncateId(id: string): string {
  if (id.length <= 16) return id
  return `${id.slice(0, 8)}...${id.slice(-4)}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const EVENT_COLORS: Record<string, string> = {
  opened:  'rgba(74,222,128,0.15)',
  used:    'rgba(124,106,247,0.15)',
  closed:  'rgba(248,113,113,0.15)',
  settled: 'rgba(250,204,21,0.15)',
}

const EVENT_TEXT: Record<string, string> = {
  opened:  '#4ade80',
  used:    '#a78bfa',
  closed:  '#f87171',
  settled: '#facc15',
}

const EXAMPLE_QUERIES = ['what is Stellar MPP', 'AI agent payments', 'x402 protocol']

export function SessionPanel({ baseUrl, defaultPublicKey = '' }: SessionPanelProps) {
  const session = useSession(baseUrl)

  const [publicKey, setPublicKey]         = useState(defaultPublicKey)
  const [depositAmount, setDepositAmount] = useState('0.10')
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<SessionSearchResponse | null>(null)
  const [record, setRecord]             = useState<SessionRecord | null>(null)

  const handleOpen = useCallback(async () => {
    const res = await session.open(publicKey.trim(), depositAmount.trim())
    if (res) {
      const rec = await session.refetch()
      setRecord(rec)
    }
  }, [session, publicKey, depositAmount])

  const handleSearch = useCallback(async (q: string) => {
    const res = await session.search(q)
    if (res) {
      setResults(res)
      const rec = await session.refetch()
      setRecord(rec)
    }
  }, [session])

  const handleClose = useCallback(async () => {
    await session.close()
    setResults(null)
    setRecord(null)
  }, [session])

  const isLoading = session.status === 'loading'
  const hasSession = session.session !== null
  const errorClass = session.error?.includes('402') ? 'status-402' : 'status-error'

  return (
    <div>
      {/* Two-column top section */}
      <div className="two-col" style={{ marginBottom: 28 }}>

        {/* Left: Session Control */}
        <div className="panel">
          <div className="panel-header">
            <span style={{ fontSize: 15 }}>⬡</span>
            <h3>Session Control</h3>
            <span className="panel-cost">MPP Session</span>
          </div>
          <div className="panel-body">

            {!hasSession ? (
              <>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                    Agent Public Key
                  </label>
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="G... Stellar public key"
                    style={{ width: '100%' }}
                    disabled={isLoading}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                    Deposit Amount (USDC)
                  </label>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.10"
                    style={{ width: '100%' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  className="btn"
                  onClick={handleOpen}
                  disabled={isLoading || !publicKey.trim()}
                  style={{ width: '100%' }}
                >
                  {isLoading ? 'Opening…' : 'Open Session'}
                </button>
              </>
            ) : (
              <>
                {/* Session state */}
                <div style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Session ID
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 3,
                      background: 'rgba(74,222,128,0.12)',
                      color: 'var(--green)',
                      textTransform: 'uppercase',
                    }}>
                      {session.session!.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
                    {truncateId(session.session!.sessionId)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Deposited</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>
                        {session.session!.depositAmount} USDC
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Used</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)' }}>
                        {record?.usedAmount ?? '0.00'} USDC
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Queries</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>
                        {record?.requestCount ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Opened</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>
                        {formatTime(session.session!.openedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{ width: '100%', borderColor: 'rgba(248,113,113,0.4)', color: 'var(--red)' }}
                >
                  {isLoading ? 'Settling…' : 'Close & Settle'}
                </button>
              </>
            )}

            {isLoading && (
              <div className="status-loading" style={{ marginTop: 10 }}>
                {hasSession ? 'Processing…' : 'Opening session…'}
              </div>
            )}
            {session.error && (
              <div className={errorClass} style={{ marginTop: 10 }}>
                {session.error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Session Search */}
        <div className="panel">
          <div className="panel-header">
            <span style={{ fontSize: 15 }}>⌕</span>
            <h3>Session Search</h3>
            <span className="panel-cost">0.01 USDC / query</span>
          </div>
          <div className="panel-body">
            {!hasSession ? (
              <div style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 13,
              }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>⬡</div>
                Open a session first to search
              </div>
            ) : (
              <>
                <div className="input-row">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && query.trim() && handleSearch(query.trim())}
                    placeholder="Search query…"
                    disabled={isLoading}
                  />
                  <button
                    className="btn"
                    onClick={() => handleSearch(query.trim())}
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? '…' : 'Search'}
                  </button>
                </div>

                {/* Quick picks */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {EXAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      className="btn btn-outline"
                      onClick={() => { setQuery(q); handleSearch(q) }}
                      disabled={isLoading}
                      style={{ fontSize: 11, padding: '5px 10px' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Results */}
                {results && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {results.results.length} results for "{results.query}"
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                        via {results.source} · req #{results.session.requestCount}
                      </span>
                    </div>
                    {results.results.map((r, i) => (
                      <div key={i} className="result-block">
                        <div className="result-title">{r.title}</div>
                        <div className="result-url">{r.url}</div>
                        <div className="result-desc">{r.description}</div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event log */}
      {record && record.events.length > 0 && (
        <div className="feed-container">
          <div className="feed-header">
            <span className="feed-title">Session Event Log</span>
            <span className="feed-count">{record.events.length} events</span>
          </div>
          <div className="feed-list">
            {[...record.events].reverse().map((ev, i) => (
              <div key={i} className="feed-row">
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: EVENT_COLORS[ev.type] ?? 'var(--border)',
                  color: EVENT_TEXT[ev.type] ?? 'var(--muted-light)',
                  whiteSpace: 'nowrap',
                }}>
                  {ev.type}
                </span>
                <span className="feed-query">{ev.detail}</span>
                <span className="feed-time">{formatTime(ev.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
