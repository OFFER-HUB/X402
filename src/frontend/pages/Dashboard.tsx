import { useState } from 'react'
import { Leva } from 'leva'
import { GL } from '../components/gl/index.js'
import { Logo } from '../components/logo.js'
import { useTransactionFeed } from '../hooks/index.js'
import { useWallet } from '../contexts/WalletContext.js'
import { StatsBar } from '../components/StatsBar.js'
import { TransactionFeed } from '../components/TransactionFeed.js'
import { SearchPanel } from '../components/SearchPanel.js'
import { FinancePanel } from '../components/FinancePanel.js'
import { InferencePanel } from '../components/InferencePanel.js'
import { SessionPanel } from '../components/SessionPanel.js'

type Page = 'dashboard' | 'search' | 'finance' | 'inference' | 'session'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const NAV: { id: Page; label: string; icon: string; cost?: string }[] = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard' },
  { id: 'search',    icon: '⌕', label: 'Web Search',     cost: '0.01 USDC'  },
  { id: 'finance',   icon: '◉', label: 'Finance',        cost: '0.001 USDC' },
  { id: 'inference', icon: '◆', label: 'Inference',      cost: '0.005 USDC' },
  { id: 'session',   icon: '⬡', label: 'Session Search', cost: '0.01 USDC'  },
]

const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',      subtitle: 'Live feed of paid API calls from AI agents' },
  search:    { title: 'Web Search',     subtitle: 'GET /search — Stellar MPP Charge · 0.01 USDC per query' },
  finance:   { title: 'Finance Quotes', subtitle: 'GET /finance/quote — Stellar MPP Charge · 0.001 USDC per symbol' },
  inference: { title: 'AI Inference',   subtitle: 'POST /inference — Stellar MPP Charge · 0.005 USDC per prompt' },
  session:   { title: 'Session Search', subtitle: 'POST /session/search — MPP Session · 1 deposit, N off-chain queries' },
}

function getInitialPage(): Page {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  const valid: Page[] = ['dashboard', 'search', 'finance', 'inference', 'session']
  return valid.includes(tab as Page) ? (tab as Page) : 'dashboard'
}

function WalletWidget() {
  const wallet = useWallet()

  const statusLabel: Record<string, string> = {
    idle:       'Initializing…',
    generating: 'Generating wallet…',
    funding:    'Funding via Friendbot…',
    ready:      '',
    error:      'Wallet error',
  }

  return (
    <div style={{
      padding: '14px 20px',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: 8,
      }}>
        Demo Wallet
      </div>

      {wallet.status !== 'ready' && wallet.status !== 'error' ? (
        <div className="status-loading">{statusLabel[wallet.status]}</div>
      ) : wallet.status === 'error' ? (
        <div style={{ fontSize: 11, color: 'var(--red)' }}>{wallet.error}</div>
      ) : (
        <>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--muted-light)',
            marginBottom: 6,
            wordBreak: 'break-all',
          }}>
            {wallet.publicKey
              ? `${wallet.publicKey.slice(0, 6)}…${wallet.publicKey.slice(-4)}`
              : '—'}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: wallet.xlmBalance ? 'var(--green)' : 'var(--muted)',
            }}>
              {wallet.xlmBalance
                ? `${parseFloat(wallet.xlmBalance).toFixed(1)} XLM`
                : '0 XLM'}
            </span>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: wallet.usdcBalance && parseFloat(wallet.usdcBalance) > 0
                ? 'var(--accent)'
                : 'var(--muted)',
            }}>
              {wallet.usdcBalance
                ? `${parseFloat(wallet.usdcBalance).toFixed(4)} USDC`
                : '0 USDC'}
            </span>
          </div>

          {(!wallet.usdcBalance || parseFloat(wallet.usdcBalance) === 0) && (
            <div style={{
              fontSize: 10,
              color: 'var(--muted)',
              lineHeight: 1.5,
              marginBottom: 6,
            }}>
              Fund with USDC to enable payments. Or run{' '}
              <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                npm run agent
              </code>{' '}
              to use the server wallet.
            </div>
          )}

          <button
            onClick={wallet.refresh}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              cursor: 'pointer',
              padding: '3px 8px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            ↻ refresh
          </button>
        </>
      )}
    </div>
  )
}

export function Dashboard() {
  const [page, setPage] = useState<Page>(getInitialPage)
  const feed = useTransactionFeed(BASE_URL)
  const wallet = useWallet()
  const meta = PAGE_META[page]

  return (
    <>
      <Leva hidden />
      <GL hovering={false} />
      <div className="layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Logo style={{ width: '110px', height: 'auto' }} />
            </a>
          </div>

          <nav className="nav-group">
            <div className="nav-label">Services</div>
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
                {item.cost && <span className="nav-item-cost">{item.cost}</span>}
              </button>
            ))}

            <div className="nav-label" style={{ marginTop: 24 }}>Links</div>
            <a href="/" className="nav-item" style={{ textDecoration: 'none' }}>
              <span className="nav-item-icon">←</span>
              Back to Home
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="connection-badge">
              <span className={`connection-dot${feed.connected ? ' connected' : ''}`} />
              {feed.connected ? 'Live' : 'Connecting…'}
            </div>
          </div>

          {/* Wallet widget */}
          <WalletWidget />
        </aside>

        {/* ── Main content ── */}
        <div className="main">
          <header className="page-header">
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </header>

          <div className="page-body">
            {page === 'dashboard' && (
              <>
                <StatsBar stats={feed.stats} />
                <TransactionFeed
                  transactions={feed.transactions}
                  connected={feed.connected}
                  error={feed.error}
                />
              </>
            )}
            {page === 'search'    && (
              <SearchPanel baseUrl={BASE_URL} wallet={wallet} />
            )}
            {page === 'finance'   && (
              <FinancePanel baseUrl={BASE_URL} wallet={wallet} />
            )}
            {page === 'inference' && (
              <InferencePanel baseUrl={BASE_URL} wallet={wallet} />
            )}
            {page === 'session'   && (
              <SessionPanel
                baseUrl={BASE_URL}
                defaultPublicKey={wallet.publicKey ?? ''}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
