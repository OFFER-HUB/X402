import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import searchMppRoute from './routes/search.js'
import searchX402Route from './routes/search-x402.js'
import financeRoute from './routes/finance.js'
import inferenceRoute from './routes/inference.js'
import dashboardRoute from './routes/dashboard.js'
import { getTransactions, getStats } from './store.js'
import { network } from './mpp.js'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

// ── MPP-gated routes ──────────────────────────────────────────────────────────
app.route('/search', searchMppRoute)
app.route('/finance', financeRoute)
app.route('/inference', inferenceRoute)

// ── x402-gated routes (same services, different protocol) ─────────────────────
app.route('/x402/search', searchX402Route)

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.route('/dashboard', dashboardRoute)

// ── Public info ───────────────────────────────────────────────────────────────
app.get('/', (c) =>
  c.json({
    name: 'Metered',
    tagline: 'Pay-per-use APIs for AI agents',
    network: `stellar:${network}`,
    protocols: ['Stellar MPP', 'x402'],
    services: [
      {
        path: '/search?q=<query>',
        protocol: 'Stellar MPP',
        price: '0.01 USDC',
        description: 'Web search — no subscription needed',
      },
      {
        path: '/finance/quote?symbol=<ticker>',
        protocol: 'Stellar MPP',
        price: '0.001 USDC',
        description: 'Real-time stock data',
      },
      {
        path: '/x402/search?q=<query>',
        protocol: 'x402',
        price: '0.01 USDC',
        description: 'Web search via x402 (Coinbase standard)',
      },
      {
        path: '/inference',
        protocol: 'Stellar MPP',
        price: '0.005 USDC',
        description: 'AI inference — POST { prompt, model? }',
      },
    ],
  })
)

app.get('/transactions', (c) => c.json(getTransactions()))
app.get('/stats', (c) => c.json(getStats()))

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🚀 Metered API  →  http://localhost:${port}`)
  console.log(`📡 Network: Stellar ${network}`)
  console.log(``)
  console.log(`  MPP  /search?q=<query>               0.01 USDC`)
  console.log(`  MPP  /finance/quote?symbol=NVDA       0.001 USDC`)
  console.log(`  MPP  /inference                       0.005 USDC`)
  console.log(`  x402 /x402/search?q=<query>           0.01 USDC`)
  console.log(``)
  console.log(`  GET  /transactions  →  live tx feed`)
  console.log(`  GET  /stats         →  usage stats`)
  console.log(`  GET  /dashboard     →  live UI\n`)
})
