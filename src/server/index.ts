import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import searchMppRoute from './routes/search.js'
import searchX402Route from './routes/search-x402.js'
import searchSessionRoute from './routes/search-session.js'
import financeRoute from './routes/finance.js'
import inferenceRoute from './routes/inference.js'
import dashboardRoute from './routes/dashboard.js'
import { getTransactions, getStats } from './store.js'
import { getAllSessions } from './session.js'
import { network } from './mpp.js'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

// ── MPP Charge routes (1 tx per request) ─────────────────────────────────────
app.route('/search', searchMppRoute)
app.route('/finance', financeRoute)
app.route('/inference', inferenceRoute)

// ── MPP Session routes (1 deposit, N off-chain, 1 settlement) ─────────────────
app.route('/session/search', searchSessionRoute)

// ── x402-gated routes ─────────────────────────────────────────────────────────
app.route('/x402/search', searchX402Route)

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.route('/dashboard', dashboardRoute)

// ── Public info ───────────────────────────────────────────────────────────────
app.get('/', (c) =>
  c.json({
    name: 'Metered',
    tagline: 'Pay-per-use APIs for AI agents',
    network: `stellar:${network}`,
    protocols: ['Stellar MPP Charge', 'Stellar MPP Session', 'x402'],
    services: [
      {
        path: '/search?q=<query>',
        protocol: 'Stellar MPP Charge',
        price: '0.01 USDC per request',
        description: 'Web search - 1 on-chain tx per call',
      },
      {
        path: '/finance/quote?symbol=<ticker>',
        protocol: 'Stellar MPP Charge',
        price: '0.001 USDC per request',
        description: 'Real-time stock data',
      },
      {
        path: '/inference',
        protocol: 'Stellar MPP Charge',
        price: '0.005 USDC per request',
        description: 'AI inference - POST { prompt, model? }',
      },
      {
        path: '/session/search',
        protocol: 'Stellar MPP Session',
        price: '0.01 USDC per request (off-chain)',
        description: 'Web search via payment channel - 1 deposit, N queries, 1 settlement',
        endpoints: {
          open:  'POST /session/search/open',
          query: 'POST /session/search',
          close: 'POST /session/search/close',
          state: 'GET  /session/search/:sessionId',
        },
      },
      {
        path: '/x402/search?q=<query>',
        protocol: 'x402',
        price: '0.01 USDC per request',
        description: 'Web search via x402 (Coinbase standard)',
      },
    ],
  })
)

app.get('/transactions', (c) => c.json(getTransactions()))
app.get('/stats', (c) => c.json(getStats()))
app.get('/sessions', (c) => c.json(getAllSessions()))

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🚀 Metered API  ->  http://localhost:${port}`)
  console.log(`📡 Network: Stellar ${network}`)
  console.log(``)
  console.log(`  MPP Charge  /search?q=<query>               0.01 USDC`)
  console.log(`  MPP Charge  /finance/quote?symbol=NVDA       0.001 USDC`)
  console.log(`  MPP Charge  /inference                       0.005 USDC`)
  console.log(`  MPP Session /session/search                  0.01 USDC (off-chain)`)
  console.log(`  x402        /x402/search?q=<query>           0.01 USDC`)
  console.log(``)
  console.log(`  GET  /transactions  ->  live tx feed`)
  console.log(`  GET  /stats         ->  usage stats`)
  console.log(`  GET  /sessions      ->  session lifecycle events`)
  console.log(`  GET  /dashboard     ->  live dashboard UI\n`)
})