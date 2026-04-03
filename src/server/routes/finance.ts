import { Hono } from 'hono'
import { mppx } from '../mpp.js'
import { getStockQuote } from '../services/finance.js'
import { logTransaction } from '../store.js'

const app = new Hono()

app.get('/quote', async (c) => {
  const result = await mppx.charge({
    amount: '0.001',
    description: 'Stock quote — 0.001 USDC per request',
  })(c.req.raw)

  if (result.status === 402) return result.challenge

  const symbol = c.req.query('symbol')
  if (!symbol) return c.json({ error: 'Missing param ?symbol=' }, 400)

  try {
    const data = await getStockQuote(symbol)
    logTransaction({ service: 'finance', amount: '0.001', query: symbol })
    return result.withReceipt(Response.json(data))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
