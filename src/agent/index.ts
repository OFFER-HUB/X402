import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { Keypair } from '@stellar/stellar-sdk'
import { Mppx, stellar } from '@stellar/mpp/charge/client'

// ── MPP client — patches global fetch() to auto-handle 402 responses ─────────
Mppx.create({
  methods: [stellar.charge({ keypair: Keypair.fromSecret(process.env.AGENT_SECRET_KEY!) })],
})

const anthropic = new Anthropic()
const BASE_URL = process.env.SERVER_URL || 'http://localhost:3000'

// ── Budget ────────────────────────────────────────────────────────────────────
// Usage: npm run agent "question" 0.10
const BUDGET_USDC = parseFloat(process.argv[3] ?? process.env.AGENT_BUDGET ?? '0.10')
let totalSpent = 0

const TOOL_PRICES: Record<string, number> = {
  web_search: 0.01,
  get_stock_quote: 0.001,
}

function checkBudget(tool: string): void {
  const cost = TOOL_PRICES[tool] ?? 0.01
  if (totalSpent + cost > BUDGET_USDC) {
    throw new Error(
      `Budget exhausted: spent ${totalSpent.toFixed(4)} USDC of ${BUDGET_USDC} USDC. ` +
      `Cannot afford ${tool} (${cost} USDC). Use what you have to answer.`
    )
  }
}

// ── Spend tracker ─────────────────────────────────────────────────────────────
const spending: Record<string, { calls: number; usdc: number }> = {}

function trackSpend(tool: string, amount: number) {
  if (!spending[tool]) spending[tool] = { calls: 0, usdc: 0 }
  spending[tool].calls++
  spending[tool].usdc += amount
  totalSpent += amount
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const tools: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description:
      'Search the web for current information. Costs 0.01 USDC per query via Stellar MPP — payment is automatic.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_stock_quote',
    description:
      'Get real-time stock price and financial data. Costs 0.001 USDC per request via Stellar MPP.',
    input_schema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol, e.g. NVDA, AAPL, TSLA' },
      },
      required: ['symbol'],
    },
  },
]

// ── Tool execution ────────────────────────────────────────────────────────────
async function callTool(name: string, input: Record<string, string>): Promise<unknown> {
  // Guard: check budget BEFORE making the payment
  checkBudget(name)

  if (name === 'web_search') {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(input.query)}`)
    if (!res.ok) throw new Error(`Search failed: ${res.status}`)
    trackSpend('web_search', TOOL_PRICES.web_search)
    return res.json()
  }

  if (name === 'get_stock_quote') {
    const res = await fetch(`${BASE_URL}/finance/quote?symbol=${encodeURIComponent(input.symbol)}`)
    if (!res.ok) throw new Error(`Finance failed: ${res.status}`)
    trackSpend('get_stock_quote', TOOL_PRICES.get_stock_quote)
    return res.json()
  }

  throw new Error(`Unknown tool: ${name}`)
}

// ── Agent loop ────────────────────────────────────────────────────────────────
async function runAgent(question: string) {
  console.log(`\n🤖 Question: ${question}`)
  console.log(`💼 Budget: ${BUDGET_USDC} USDC`)
  console.log(`${'─'.repeat(60)}`)

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }]

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      console.log(`\n📊 Answer:\n${'─'.repeat(60)}\n${text?.text ?? '(no text)'}`)
      printSpendingSummary()
      break
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const cost = TOOL_PRICES[block.name] ?? 0.01
        const remaining = BUDGET_USDC - totalSpent
        console.log(`\n💳 ${block.name}  |  cost: ${cost} USDC  |  remaining: ${remaining.toFixed(4)} USDC`)
        console.log(`   ${JSON.stringify(block.input)}`)

        try {
          const result = await callTool(block.name, block.input as Record<string, string>)
          console.log(`   ✅ paid ${cost} USDC via Stellar MPP`)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
        } catch (err: any) {
          const isBudget = err.message.startsWith('Budget exhausted')
          console.log(isBudget ? `   🛑 ${err.message}` : `   ❌ ${err.message}`)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: err.message,
            is_error: true,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }
}

function printSpendingSummary() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`💰 Spending summary  (budget: ${BUDGET_USDC} USDC)`)
  for (const [tool, s] of Object.entries(spending)) {
    console.log(`   ${tool}: ${s.calls} call(s)  →  ${s.usdc.toFixed(4)} USDC`)
  }
  console.log(`   ─────────────────────────────`)
  console.log(`   Total spent: ${totalSpent.toFixed(4)} USDC  /  ${BUDGET_USDC} USDC`)
  console.log(`   Remaining:   ${(BUDGET_USDC - totalSpent).toFixed(4)} USDC`)
  console.log(`${'─'.repeat(60)}\n`)
}

// ── Run ───────────────────────────────────────────────────────────────────────
const question =
  process.argv[2] ??
  'Is Nvidia a good investment right now? Search for the latest news and get the current stock price, then give me a brief analysis.'

runAgent(question).catch(console.error)
