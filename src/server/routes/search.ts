import { Hono } from 'hono'
import { mppx } from '../mpp.js'
import { searchWeb } from '../services/search.js'
import { logTransaction } from '../store.js'

const app = new Hono()

app.get('/', async (c) => {
  const result = await mppx.charge({
    amount: '0.01',
    description: 'Web search — 0.01 USDC per query',
  })(c.req.raw)

  if (result.status === 402) return result.challenge

  const q = c.req.query('q')
  if (!q) return c.json({ error: 'Missing query param ?q=' }, 400)

  try {
    const data = await searchWeb(q)
    logTransaction({ service: 'search', amount: '0.01', query: q })
    return result.withReceipt(Response.json(data))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app
