import 'dotenv/config'
// import Anthropic from '@anthropic-ai/sdk'
import { Keypair } from '@stellar/stellar-sdk'
import { Mppx, stellar } from '@stellar/mpp/charge/client'

Mppx.create({
  methods: [stellar.charge({ keypair: Keypair.fromSecret(process.env.AGENT_SECRET_KEY!) })],
})

// const anthropic = new Anthropic()
const BASE_URL = process.env.SERVER_URL || 'http://localhost:3000'
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_MODEL = 'llama-3.1-8b-instant'

const BUDGET_USDC = parseFloat(process.argv[3] ?? process.env.AGENT_BUDGET ?? '0.10')
let totalSpent = 0

const TOOL_PRICES: Record<string, number> = { web_search: 0.01, get_stock_quote: 0.001 }

function checkBudget(tool: string): void {
  const cost = TOOL_PRICES[tool] ?? 0.01
  if (totalSpent + cost > BUDGET_USDC)
    throw new Error(`Budget exhausted: spent ${totalSpent.toFixed(4)} USDC of ${BUDGET_USDC} USDC. Cannot afford ${tool} (${cost} USDC).`)
}

const spending: Record<string, { calls: number; usdc: number }> = {}
function trackSpend(tool: string, amount: number) {
  if (!spending[tool]) spending[tool] = { calls: 0, usdc: 0 }
  spending[tool].calls++
  spending[tool].usdc += amount
  totalSpent += amount
}

const tools = [
  { type: 'function' as const, function: { name: 'web_search', description: 'Search the web. Costs 0.01 USDC via Stellar MPP.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function' as const, function: { name: 'get_stock_quote', description: 'Get real-time stock price. Costs 0.001 USDC via Stellar MPP.', parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] } } },
]

async function callTool(name: string, input: Record<string, string>): Promise<unknown> {
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

async function groqChat(messages: any[]): Promise<any> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 4096, tools, tool_choice: 'auto', messages }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function runAgent(question: string) {
  console.log(`\n🤖 Question: ${question}`)
  console.log(`💼 Budget: ${BUDGET_USDC} USDC`)
  console.log(`${'─'.repeat(60)}`)

  const messages: any[] = [{ role: 'user', content: question }]

  while (true) {
    const response = await groqChat(messages)
    const choice = response.choices[0]
    const msg = choice.message
    messages.push(msg)

    if (choice.finish_reason === 'stop' || !msg.tool_calls?.length) {
      console.log(`\n📊 Answer:\n${'─'.repeat(60)}\n${msg.content ?? '(no text)'}`)
      printSpendingSummary()
      break
    }

    for (const toolCall of msg.tool_calls) {
      const name = toolCall.function.name
      const input = JSON.parse(toolCall.function.arguments)
      const cost = TOOL_PRICES[name] ?? 0.01
      console.log(`\n💳 ${name}  |  cost: ${cost} USDC  |  remaining: ${(BUDGET_USDC - totalSpent).toFixed(4)} USDC`)
      console.log(`   ${JSON.stringify(input)}`)
      let content: string
      try {
        const result = await callTool(name, input)
        console.log(`   ✅ paid ${cost} USDC via Stellar MPP`)
        content = JSON.stringify(result)
      } catch (err: any) {
        console.log(err.message.startsWith('Budget') ? `   🛑 ${err.message}` : `   ❌ ${err.message}`)
        content = err.message
      }
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content })
    }
  }
}

function printSpendingSummary() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`💰 Spending summary  (budget: ${BUDGET_USDC} USDC)`)
  for (const [tool, s] of Object.entries(spending))
    console.log(`   ${tool}: ${s.calls} call(s)  ->  ${s.usdc.toFixed(4)} USDC`)
  console.log(`   Total spent: ${totalSpent.toFixed(4)} USDC  /  ${BUDGET_USDC} USDC`)
  console.log(`   Remaining:   ${(BUDGET_USDC - totalSpent).toFixed(4)} USDC`)
  console.log(`${'─'.repeat(60)}\n`)
}

const question = process.argv[2] ?? 'Is Nvidia a good investment right now? Search for the latest news and get the current stock price, then give me a brief analysis.'
runAgent(question).catch(console.error)
