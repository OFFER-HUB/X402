import { Hono } from 'hono'
import { getTransactions, getStats } from '../store.js'

const app = new Hono()

// Live JSON feeds (polled by dashboard JS)
app.get('/data', (c) => c.json({ transactions: getTransactions(), stats: getStats() }))

// Dashboard HTML
app.get('/', (c) => {
  return c.html(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Metered — Live Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0a0f;
      --surface: #13131a;
      --border: #1e1e2e;
      --accent: #7c3aed;
      --accent-dim: #4c1d95;
      --green: #10b981;
      --yellow: #f59e0b;
      --text: #e2e8f0;
      --muted: #64748b;
      --font: 'SF Mono', 'Fira Code', monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 13px;
      min-height: 100vh;
    }

    header {
      padding: 20px 32px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
    .logo span { color: var(--accent); }

    .tagline { color: var(--muted); font-size: 11px; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      background: var(--accent-dim);
      color: #c4b5fd;
    }

    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    main { padding: 28px 32px; }

    /* Stats grid */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
    }

    .stat-label { color: var(--muted); font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 26px; font-weight: 700; color: var(--text); }
    .stat-value.green { color: var(--green); }
    .stat-value.accent { color: #a78bfa; }

    /* Services breakdown */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
    }

    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
      margin-bottom: 14px;
    }

    .service-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    .service-row:last-child { border-bottom: none; }

    .service-name { color: var(--text); }
    .service-meta { display: flex; gap: 16px; color: var(--muted); }
    .service-meta span { text-align: right; }
    .service-meta .hl { color: var(--green); font-weight: 600; }

    /* Protocol breakdown */
    .proto-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .proto-label { width: 60px; color: var(--muted); }
    .proto-bar-bg { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .proto-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .mpp-bar { background: var(--accent); }
    .x402-bar { background: var(--yellow); }
    .proto-count { width: 40px; text-align: right; color: var(--text); }

    /* Transaction feed */
    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .feed-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); }

    #tx-list { display: flex; flex-direction: column; gap: 8px; }

    .tx {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: 80px 1fr 90px 90px 130px;
      align-items: center;
      gap: 12px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .tx-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .tx-search   { background: #1e3a5f; color: #60a5fa; }
    .tx-finance  { background: #14532d; color: #34d399; }
    .tx-x402     { background: #451a03; color: #fbbf24; }

    .tx-query { color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-amount { color: var(--green); font-weight: 700; text-align: right; }
    .tx-proto { color: var(--muted); text-align: center; font-size: 11px; }
    .tx-time { color: var(--muted); text-align: right; font-size: 11px; }

    .empty {
      text-align: center;
      padding: 48px;
      color: var(--muted);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .empty code {
      display: block;
      margin-top: 12px;
      color: var(--accent);
      font-size: 12px;
    }

    footer {
      margin-top: 32px;
      padding: 20px 32px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="logo">me<span>t</span>ered</div>
      <div class="tagline">Where AI agents go to spend money.</div>
    </div>
    <div class="badge">
      <div class="dot"></div>
      Live · Stellar Testnet
    </div>
  </header>

  <main>
    <!-- Stats -->
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total USDC paid</div>
        <div class="stat-value green" id="total-usdc">0.0000</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total requests</div>
        <div class="stat-value accent" id="total-calls">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">Search calls</div>
        <div class="stat-value" id="search-calls">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">Finance calls</div>
        <div class="stat-value" id="finance-calls">0</div>
      </div>
    </div>

    <div class="grid">
      <!-- Services -->
      <div class="card">
        <div class="card-title">Services</div>
        <div id="service-rows">
          <div class="service-row">
            <div class="service-name">Web Search</div>
            <div class="service-meta">
              <span>0.01 USDC/query</span>
              <span class="hl" id="svc-search">0 calls</span>
            </div>
          </div>
          <div class="service-row">
            <div class="service-name">Financial Data</div>
            <div class="service-meta">
              <span>0.001 USDC/quote</span>
              <span class="hl" id="svc-finance">0 calls</span>
            </div>
          </div>
          <div class="service-row">
            <div class="service-name">Search (x402)</div>
            <div class="service-meta">
              <span>0.01 USDC/query</span>
              <span class="hl" id="svc-x402">0 calls</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Protocol split -->
      <div class="card">
        <div class="card-title">Protocol split</div>
        <div style="margin-top:8px">
          <div class="proto-row">
            <div class="proto-label">MPP</div>
            <div class="proto-bar-bg"><div class="proto-bar mpp-bar" id="mpp-bar" style="width:0%"></div></div>
            <div class="proto-count" id="mpp-count">0</div>
          </div>
          <div class="proto-row">
            <div class="proto-label">x402</div>
            <div class="proto-bar-bg"><div class="proto-bar x402-bar" id="x402-bar" style="width:0%"></div></div>
            <div class="proto-count" id="x402-count">0</div>
          </div>
        </div>
        <div style="margin-top:20px; color: var(--muted); font-size:11px; line-height:1.6">
          MPP — Stellar's native payment channel protocol<br>
          x402 — Coinbase open standard (HTTP 402)
        </div>
      </div>
    </div>

    <!-- Transaction feed -->
    <div class="feed-header">
      <div class="feed-title">Live transaction feed</div>
      <div class="badge" style="font-size:10px">auto-refresh 2s</div>
    </div>
    <div id="tx-list">
      <div class="empty">
        No transactions yet.
        <code>npm run agent "Analyze Nvidia as an investment"</code>
      </div>
    </div>
  </main>

  <footer>
    <span>Metered · Stellar Hacks: Agents 2026</span>
    <span id="last-updated">—</span>
  </footer>

  <script>
    function serviceClass(s) {
      if (s === 'search-x402') return 'tx-x402'
      if (s.startsWith('finance')) return 'tx-finance'
      return 'tx-search'
    }

    function serviceLabel(s) {
      if (s === 'search-x402') return 'search·x402'
      if (s.startsWith('finance')) return 'finance'
      return 'search'
    }

    function proto(s) {
      return s === 'search-x402' ? 'x402' : 'MPP'
    }

    function fmt(ts) {
      return new Date(ts).toLocaleTimeString()
    }

    async function refresh() {
      try {
        const res = await fetch('/dashboard/data')
        const { transactions, stats } = await res.json()

        // Stats
        document.getElementById('total-usdc').textContent = stats.totalUsdc ?? '0.0000'
        document.getElementById('total-calls').textContent = stats.totalCalls ?? 0

        const svcs = stats.services ?? {}
        const searchCalls = (svcs['search']?.calls ?? 0) + (svcs['search-x402']?.calls ?? 0)
        const financeCalls = svcs['finance']?.calls ?? 0
        document.getElementById('search-calls').textContent = searchCalls
        document.getElementById('finance-calls').textContent = financeCalls
        document.getElementById('svc-search').textContent = (svcs['search']?.calls ?? 0) + ' calls'
        document.getElementById('svc-finance').textContent = financeCalls + ' calls'
        document.getElementById('svc-x402').textContent = (svcs['search-x402']?.calls ?? 0) + ' calls'

        // Protocol split
        const mppCount = (svcs['search']?.calls ?? 0) + financeCalls
        const x402Count = svcs['search-x402']?.calls ?? 0
        const total = mppCount + x402Count || 1
        document.getElementById('mpp-count').textContent = mppCount
        document.getElementById('x402-count').textContent = x402Count
        document.getElementById('mpp-bar').style.width = (mppCount / total * 100) + '%'
        document.getElementById('x402-bar').style.width = (x402Count / total * 100) + '%'

        // Tx feed
        const list = document.getElementById('tx-list')
        if (!transactions.length) {
          list.innerHTML = \`<div class="empty">No transactions yet.<code>npm run agent "Analyze Nvidia as an investment"</code></div>\`
        } else {
          list.innerHTML = transactions.map(tx => \`
            <div class="tx">
              <span class="tx-badge \${serviceClass(tx.service)}">\${serviceLabel(tx.service)}</span>
              <span class="tx-query">\${tx.query}</span>
              <span class="tx-amount">+\${tx.amount} USDC</span>
              <span class="tx-proto">\${proto(tx.service)}</span>
              <span class="tx-time">\${fmt(tx.timestamp)}</span>
            </div>
          \`).join('')
        }

        document.getElementById('last-updated').textContent = 'updated ' + new Date().toLocaleTimeString()
      } catch (e) {
        console.error('refresh failed', e)
      }
    }

    refresh()
    setInterval(refresh, 2000)
  </script>
</body>
</html>`)
})

export default app
