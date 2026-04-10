# Metered

**Where AI agents go to spend money.**

---

## Problem

AI agents can reason and execute tasks — but they cannot transact.

Every service they need is locked behind subscriptions, API keys, and billing systems designed for humans. The moment an agent needs to pay for something, it stops. A human has to step in.

**This breaks autonomy.**

---

## Insight

The payment infrastructure already exists.

With x402 and Stellar micropayments, agents can pay per request — instantly, at near-zero cost, without accounts or API keys.

What's missing is the economic layer on top: a system where agents can **discover, evaluate, and transact with services autonomously**.

---

## Solution

Metered is an execution layer for AI agents to discover, evaluate, and pay for services in real time.

- **Pay-per-use** — no subscriptions, no commitments
- **No API keys** — the payment receipt is the credential
- **Budget-aware** — agents stop spending when the limit is reached
- **Three payment protocols** — Stellar MPP Charge, MPP Session (payment channels), and x402
- **Native machine-to-machine** — built on Stellar MPP and x402

---

## Live Services

| Service | Endpoint | Protocol | Price |
|---|---|---|---|
| Web Search | `GET /search?q=` | Stellar MPP Charge | 0.01 USDC |
| Financial Data | `GET /finance/quote?symbol=` | Stellar MPP Charge | 0.001 USDC |
| AI Inference | `POST /inference` | Stellar MPP Charge | 0.005 USDC |
| Session Search | `POST /session/search` | Stellar MPP Session | 0.01 USDC (off-chain) |
| x402 Search | `GET /x402/search?q=` | x402 (Coinbase) | 0.01 USDC |

---

## Payment Protocols

### MPP Charge — 1 tx per request
Standard request/pay flow. Each call triggers one on-chain Stellar transaction.

```
Agent  →  GET /search?q=nvidia
Server →  HTTP 402 + payment requirements
Agent  →  signs Stellar tx (< 5 sec, ~$0.00001 fee)
Server →  verifies + returns results with receipt header
```

### MPP Session — payment channels
Deposit once, query N times off-chain, settle once on-chain.

```
POST /session/search/open    # 1 on-chain deposit
POST /session/search         # N off-chain queries
POST /session/search/close   # 1 on-chain settlement
```

Ideal for high-frequency agents that would otherwise pay per-tx overhead on every call.

### x402 — Coinbase standard
HTTP 402 with payment verified by Coinbase's managed facilitator. Compatible with any x402 client.

---

## Demo

An agent receives a task and a budget. It selects providers, allocates spend, executes queries, and pays per request — completing the task within budget, without human intervention.

```
🤖 Question: Is Nvidia a good investment right now?
💼 Budget: 0.10 USDC
────────────────────────────────────────────────────────────

💳 web_search  |  cost: 0.01 USDC  |  remaining: 0.10 USDC
   {"query":"Nvidia earnings 2026"}
   ✅ paid 0.01 USDC via Stellar MPP

💳 get_stock_quote  |  cost: 0.001 USDC  |  remaining: 0.09 USDC
   {"symbol":"NVDA"}
   ✅ paid 0.001 USDC via Stellar MPP

📊 Answer:
────────────────────────────────────────────────────────────
Nvidia reported record revenue...

────────────────────────────────────────────────────────────
💰 Spending summary  (budget: 0.10 USDC)
   web_search: 2 call(s)  →  0.0200 USDC
   get_stock_quote: 1 call(s)  →  0.0010 USDC
   Total spent: 0.0210 USDC  /  0.10 USDC
   Remaining:   0.0790 USDC
```

---

## Architecture

```
src/
├── server/
│   ├── index.ts                 # Hono HTTP server — all routes mounted here
│   ├── mpp.ts                   # Stellar MPP — Charge intent config
│   ├── session.ts               # MPP Session — payment channel lifecycle
│   ├── store.ts                 # Transaction log + EventEmitter → dashboard
│   ├── dashboard.html           # Live transaction feed UI (SSE)
│   ├── routes/
│   │   ├── search.ts            # GET /search          — MPP Charge, 0.01 USDC
│   │   ├── finance.ts           # GET /finance/quote   — MPP Charge, 0.001 USDC
│   │   ├── inference.ts         # POST /inference      — MPP Charge, 0.005 USDC
│   │   ├── search-session.ts    # /session/search/*    — MPP Session, 0.01 USDC
│   │   ├── search-x402.ts       # GET /x402/search     — x402, 0.01 USDC
│   │   └── dashboard.ts         # GET /dashboard       — HTML + SSE stream
│   └── services/
│       ├── search.ts            # Brave Search (primary) + Jina AI (fallback)
│       ├── finance.ts           # Yahoo Finance real-time
│       └── inference.ts         # Gemini (primary) + mock fallback
├── agent/
│   └── index.ts                 # Gemini agent — budget-aware, pays autonomously
├── mcp/
│   └── index.ts                 # MCP server — plug into Claude Code
├── frontend/
│   ├── types.ts                 # TypeScript types for all API responses
│   └── hooks/                   # React hooks for consuming Metered APIs
│       ├── useTransactionFeed.ts  # SSE live transaction stream
│       ├── useStats.ts            # Usage stats (with optional polling)
│       ├── useSearch.ts           # Web search
│       ├── useFinanceQuote.ts     # Stock quotes
│       ├── useInference.ts        # AI inference
│       ├── useSession.ts          # Full MPP Session lifecycle
│       └── index.ts               # Barrel export
└── scripts/
    └── setup-wallets.ts         # One-command testnet wallet setup
```

**Stack:** Hono · Stellar MPP (`@stellar/mpp`) · x402 (`@x402/stellar`) · Gemini 2.0 Flash · MCP SDK · TypeScript · Vitest

---

## Setup

### Automatic (recommended)

```bash
npm install
npm run setup     # generates 2 wallets, funds via Friendbot, writes .env
npm run server    # start the API server on :3000
npm run agent     # run the demo agent (default budget: 0.10 USDC)
```

Custom question + budget:
```bash
npm run agent "Is Apple a good buy right now?" 0.05
```

### Environment variables

```env
# Required
STELLAR_NETWORK=testnet
MPP_SECRET_KEY=S...          # server wallet (receives payments)
STELLAR_RECIPIENT=G...       # server wallet public key
AGENT_SECRET_KEY=S...        # agent wallet (pays for services)

# Optional
BRAVE_API_KEY=               # Brave Search — falls back to Jina AI if unset
GEMINI_API_KEY=              # Gemini — /inference returns mock if unset
AGENT_BUDGET=0.10            # default spend limit in USDC
SERVER_URL=http://localhost:3000
```

### Connect to Claude Code via MCP

```bash
claude mcp add metered -- npx tsx src/mcp/index.ts
```

Then ask Claude Code: *"Search for Nvidia news and get the stock price"* — it pays automatically.

---

## Dashboard

Live transaction feed with real-time SSE updates:

```
GET http://localhost:3000/dashboard
```

Shows every paid transaction as it happens — service, amount, query, timestamp, and running stats.

---

## API Reference

```
GET  /                              API directory
GET  /transactions                  Transaction history (last 100)
GET  /stats                         Aggregated usage stats
GET  /sessions                      All session records

GET  /search?q=<query>              Web search — 0.01 USDC
GET  /finance/quote?symbol=<ticker> Stock quote — 0.001 USDC
POST /inference                     AI inference — 0.005 USDC
                                    Body: { prompt, model? }

POST /session/search/open           Open payment channel
POST /session/search                Search within session — 0.01 USDC
POST /session/search/close          Close + settle session
GET  /session/search/:sessionId     Session state

GET  /x402/search?q=<query>         x402 web search — 0.01 USDC

GET  /dashboard                     Live transaction UI
GET  /dashboard/events              SSE stream
```

---

## Frontend Hooks

React hooks for consuming Metered APIs from any frontend:

```tsx
import { useTransactionFeed, useSearch, useFinanceQuote, useInference, useSession } from './src/frontend/hooks'

// Live transaction feed via SSE
const { transactions, stats, connected } = useTransactionFeed('http://localhost:3000')

// Pay-per-use services
const { search } = useSearch('http://localhost:3000')
const { getQuote } = useFinanceQuote('http://localhost:3000')
const { infer } = useInference('http://localhost:3000')

// Payment channel (1 deposit, N queries, 1 settlement)
const { open, search: sessionSearch, close } = useSession('http://localhost:3000')
```

---

## Testing

```bash
npm test          # run all tests (vitest)
npm run test:watch  # watch mode
```

44 tests across 3 suites — store, session lifecycle, and all route handlers.

---

## Roadmap

- [x] Stellar MPP Charge — search, finance, inference
- [x] Stellar MPP Session — payment channels for high-frequency agents
- [x] x402 — search route (Coinbase standard)
- [x] Gemini agent with autonomous payment + budget enforcement
- [x] MCP server — `claude mcp add metered`
- [x] One-command wallet setup — `npm run setup`
- [x] Live SSE dashboard — real-time transaction feed
- [x] React hooks — frontend integration layer
- [x] Test suite — 44 passing tests
- [ ] Provider quality scoring — agent picks best provider automatically
- [ ] Mainnet deployment

---

## Vision

AI agents are becoming economic actors.

Metered is not a marketplace. It is the **economic layer for machine-to-machine services** — the infrastructure that lets agents operate with real autonomy, making real economic decisions, with real money.

---

*Built for [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) · Deadline April 13, 2026*
