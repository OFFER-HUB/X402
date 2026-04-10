import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { txEvents, getTransactions, getStats } from '../store.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

// ── Serve the dashboard HTML page ─────────────────────────────────────────────
app.get('/', (c) => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const html = readFileSync(join(__dirname, '..', 'dashboard.html'), 'utf-8')
  return c.html(html)
})

// ── SSE stream for real-time transaction updates ──────────────────────────────
app.get('/events', (c) => {
  return streamSSE(c, async (stream) => {
    // Send initial state on connect
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'init',
        transactions: getTransactions(),
        stats: getStats(),
      }),
    })

    // Push new transactions as they arrive
    const handler = (tx: any) => {
      stream.writeSSE({
        data: JSON.stringify({
          type: 'tx',
          transaction: tx,
          stats: getStats(),
        }),
      })
    }
    txEvents.on('new', handler)

    // Keep-alive ping every 15s to prevent proxy timeouts
    const keepAlive = setInterval(() => {
      stream.writeSSE({ data: JSON.stringify({ type: 'ping' }) })
    }, 15000)

    stream.onAbort(() => {
      txEvents.off('new', handler)
      clearInterval(keepAlive)
    })

    // Hold the stream open indefinitely
    await new Promise(() => {})
  })
})

export default app