import { Hono } from 'hono'
import { mppx } from '../mpp.js'
import { runInference } from '../services/inference.js'
import { logTransaction } from '../store.js'

const app = new Hono()

app.post('/', async (c) => {
  const result = await mppx.charge({
    amount: '0.005',
    description: 'AI inference — 0.005 USDC per request',
  })(c.req.raw)

  if (result.status === 402) return result.challenge

  const body = await c.req.json().catch(() => null)
  if (!body?.prompt) return c.json({ error: 'Missing prompt' }, 400)

  const { prompt, model } = body

  const data = await runInference(prompt, model)
  logTransaction({
    service: 'inference',
    amount: '0.005',
    query: prompt.slice(0, 50),
  })

  return result.withReceipt(Response.json(data))
})

export default app