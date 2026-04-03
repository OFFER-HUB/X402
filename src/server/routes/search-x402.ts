// x402 version of the search route — same service, different payment protocol
// Clients using x402 (Coinbase standard) pay here; MPP clients use /search
import { Hono } from 'hono'
import { paymentMiddleware } from '@x402/express'
import { searchWeb } from '../services/search.js'
import { logTransaction } from '../store.js'

const app = new Hono()

// x402 middleware: returns HTTP 402 with x402-compatible payment header
app.use('/', async (c, next) => {
  const facilitatorUrl =
    process.env.X402_FACILITATOR_URL ?? 'https://facilitator.stellar.org'

  const paymentRequired = {
    scheme: 'exact',
    network: `stellar:${process.env.STELLAR_NETWORK ?? 'testnet'}`,
    maxAmountRequired: '10000', // 0.01 USDC (6 decimals)
    resource: c.req.url,
    description: 'Web search — 0.01 USDC per query (x402)',
    mimeType: 'application/json',
    payTo: process.env.STELLAR_RECIPIENT!,
    maxTimeoutSeconds: 300,
    asset: process.env.STELLAR_NETWORK === 'mainnet'
      ? 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
      : 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    extra: {},
  }

  const xPayment = c.req.header('X-PAYMENT')
  if (!xPayment) {
    return c.json(
      { error: 'Payment required', x402Version: 1, accepts: [paymentRequired] },
      402,
      { 'X-ACCEPTS-PAYMENT': JSON.stringify([paymentRequired]) }
    )
  }

  // Verify payment via facilitator
  try {
    const verifyRes = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: xPayment, paymentRequirements: paymentRequired }),
    })
    if (!verifyRes.ok) {
      return c.json({ error: 'Payment verification failed' }, 402)
    }
  } catch {
    return c.json({ error: 'Could not reach facilitator' }, 503)
  }

  await next()
})

app.get('/', async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json({ error: 'Missing query param ?q=' }, 400)

  try {
    const data = await searchWeb(q)
    logTransaction({ service: 'search-x402', amount: '0.01', query: q })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
