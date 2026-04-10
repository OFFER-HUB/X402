import { Hono } from 'hono'
import { mppSession, createSession, recordUsage, closeSession, markSettled, getSession } from '../session.js'
import { searchWeb } from '../services/search.js'
import { logTransaction } from '../store.js'

const app = new Hono()

app.post('/open', async (c) => {
  const sessionId = crypto.randomUUID()
  const agentPublicKey = c.req.header('x-agent-public-key') ?? 'unknown'
  const depositAmount = c.req.header('x-deposit-amount') ?? '0'
  const record = createSession(sessionId, agentPublicKey, depositAmount)
  return c.json({ sessionId: record.sessionId, depositAmount: record.depositAmount, status: record.status, openedAt: record.openedAt })
})

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.sessionId) return c.json({ error: 'Missing sessionId' }, 400)
  if (!body?.q) return c.json({ error: 'Missing query (q)' }, 400)

  const session = getSession(body.sessionId)
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.status !== 'open') return c.json({ error: `Session is ${session.status}` }, 400)

  const result = await mppSession.charge({
    amount: '0.01',
    description: 'Session search - 0.01 USDC per request',
  })(c.req.raw)

  if (result.status === 402) return result.challenge

  const newUsed = String((parseFloat(session.usedAmount) + 0.01).toFixed(4))
  const updated = recordUsage(body.sessionId, newUsed)
  if (!updated) return c.json({ error: 'Failed to record usage' }, 500)

  const data = await searchWeb(body.q)
  logTransaction({ service: 'session-search', amount: '0.01', query: body.q })

  return result.withReceipt(Response.json({
    ...data,
    session: { sessionId: updated.sessionId, requestCount: updated.requestCount, usedAmount: updated.usedAmount },
  }))
})

app.post('/close', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body?.sessionId) return c.json({ error: 'Missing sessionId' }, 400)
  const session = getSession(body.sessionId)
  if (!session) return c.json({ error: 'Session not found' }, 404)
  closeSession(body.sessionId)
  const settled = markSettled(body.sessionId)
  return c.json({ sessionId: settled!.sessionId, status: settled!.status, requestCount: settled!.requestCount, totalCharged: settled!.usedAmount })
})

app.get('/:sessionId', (c) => {
  const session = getSession(c.req.param('sessionId'))
  if (!session) return c.json({ error: 'Session not found' }, 404)
  return c.json(session)
})

export default app
