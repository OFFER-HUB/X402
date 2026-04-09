import { Hono } from 'hono'
import { USDC_TESTNET_ADDRESS, USDC_PUBNET_ADDRESS, STELLAR_TESTNET_CAIP2, STELLAR_PUBNET_CAIP2 } from '@x402/stellar'
import { searchWeb } from '../services/search.js'
import { logTransaction } from '../store.js'

// Coinbase's managed facilitator for x402 on Stellar
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL ?? 'https://www.x402.org/facilitator'

const app = new Hono()

app.use('/', async (c, next) => {
  const isMainnet = process.env.STELLAR_NETWORK === 'mainnet'
  const network = isMainnet ? STELLAR_PUBNET_CAIP2 : STELLAR_TESTNET_CAIP2
  const usdcAddress = isMainnet ? USDC_PUBNET_ADDRESS : USDC_TESTNET_ADDRESS

  const paymentRequired = {
    scheme: 'exact',
    network,
    maxAmountRequired: '10000', // 0.01 USDC (6 decimals)
    resource: c.req.url,
    description: 'Web search — 0.01 USDC per query',
    mimeType: 'application/json',
    payTo: process.env.STELLAR_RECIPIENT!,
    maxTimeoutSeconds: 300,
    asset: usdcAddress,
    extra: {},
  }

  const xPayment = c.req.header('X-PAYMENT')

  // No payment header — return 402 challenge
  if (!xPayment) {
    return c.json(
      { x402Version: 1, error: 'Payment required', accepts: [paymentRequired] },
      402,
      { 'X-ACCEPTS-PAYMENT': JSON.stringify([paymentRequired]) }
    )
  }

  // Verify payment via facilitator
  try {
    const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: xPayment, paymentRequirements: paymentRequired }),
    })
    if (!verifyRes.ok) {
      const body = await verifyRes.text()
      return c.json({ error: 'Payment verification failed', detail: body }, 402)
    }
  } catch (err: any) {
    return c.json({ error: 'Facilitator unreachable', detail: err.message }, 503)
  }

  await next()
})

app.get('/', async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json({ error: 'Missing ?q= param' }, 400)

  try {
    const data = await searchWeb(q)
    logTransaction({ service: 'search-x402', amount: '0.01', query: q })
    return c.json(data)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
