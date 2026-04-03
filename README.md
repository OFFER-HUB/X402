# Metered

> Pay-per-use APIs for AI agents — no subscriptions, no API keys, just pay what you use.

Built for the **Stellar Hacks: Agents hackathon** (deadline: April 13, 2026).

---

## The problem

AI agents can't operate autonomously because every service they need (web search, financial data, compute) sits behind monthly subscriptions designed for humans — not machines.

A developer building an agent that searches the web 50 times a month shouldn't pay $20/month to Brave. They should pay $0.50 — exactly for what they use. No credit card, no account, no human in the loop.

The payment infrastructure exists (Stellar MPP, x402) but the actual services agents want to pay for don't. **We built the services.**

---

## What it does

Metered exposes real, useful APIs gated behind **Stellar MPP** and **x402** payments. An AI agent with a funded Stellar wallet can call any of these services and pay micropayments automatically — no subscriptions, no setup.

### Services

| Endpoint | Protocol | Price | What it does |
|---|---|---|---|
| `GET /search?q=<query>` | Stellar MPP | 0.01 USDC | Web search (Brave or Jina AI fallback) |
| `GET /finance/quote?symbol=<ticker>` | Stellar MPP | 0.001 USDC | Real-time stock data |
| `GET /x402/search?q=<query>` | x402 | 0.01 USDC | Same search, x402 protocol |

### How payment works

```
Agent calls GET /search?q=nvidia earnings
       ↓
Server returns HTTP 402 + payment requirements
       ↓
Agent's MPP client signs payment on Stellar (< 5 seconds, ~$0.00001 fee)
       ↓
Server verifies + returns results with payment receipt
```

No accounts. No API keys. The payment receipt **is** the credential.

---

## Architecture

```
src/
├── server/
│   ├── index.ts          # Hono HTTP server (port 3000)
│   ├── mpp.ts            # Stellar MPP charge intent setup
│   ├── store.ts          # In-memory transaction log for dashboard
│   ├── routes/
│   │   ├── search.ts     # /search — MPP gated
│   │   ├── finance.ts    # /finance/quote — MPP gated
│   │   └── search-x402.ts # /x402/search — x402 gated
│   └── services/
│       ├── search.ts     # Brave Search API (+ Jina AI fallback)
│       └── finance.ts    # Yahoo Finance real-time quotes
└── agent/
    └── index.ts          # Claude agent demo (pays autonomously)
```

**Stack:**
- [Hono](https://hono.dev/) — HTTP server (native Web API Request/Response)
- [`@stellar/mpp`](https://github.com/stellar/stellar-mpp-sdk) — Stellar MPP SDK
- [`@anthropic-ai/sdk`](https://github.com/anthropic/anthropic-sdk-ts) — Claude claude-sonnet-4-6
- `yahoo-finance2` — free real-time stock data
- Brave Search API / Jina AI — web search

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
STELLAR_NETWORK=testnet

# Server wallet (receives payments)
MPP_SECRET_KEY=S...
STELLAR_RECIPIENT=G...

# Agent wallet (pays for services)
AGENT_SECRET_KEY=S...
```

**Generate wallets:** Go to [lab.stellar.org](https://lab.stellar.org) → Generate Keypair.
Fund with testnet XLM + USDC at [friendbot.stellar.org](https://friendbot.stellar.org) and the [USDC testnet faucet](https://circle.com/usdc/developer).

### 3. Run the server

```bash
npm run server
```

```
🚀 Metered API  →  http://localhost:3000
📡 Network: Stellar testnet

  MPP  /search?q=<query>               0.01 USDC
  MPP  /finance/quote?symbol=NVDA       0.001 USDC
  x402 /x402/search?q=<query>           0.01 USDC
```

### 4. Run the agent demo

```bash
npm run agent
# or with a custom question:
npm run agent "Is Apple a good investment right now?"
```

The agent will autonomously call tools, pay for each one via Stellar MPP, and print a spending summary:

```
🤖 Question: Is Nvidia a good investment right now?
──────────────────────────────────────────────────────────────

💳 Calling tool: web_search
   Input: {"query":"Nvidia earnings 2026"}
   💰 Paying 0.01 USDC via Stellar MPP...
   ✅ Done

💳 Calling tool: get_stock_quote
   Input: {"symbol":"NVDA"}
   💰 Paying 0.001 USDC via Stellar MPP...
   ✅ Done

📊 Answer:
──────────────────────────────────────────────────────────────
Based on current data, Nvidia is trading at $X with...

──────────────────────────────────────────────────────────────
💰 Spending summary:
   web_search: 2 call(s) → 0.0200 USDC
   get_stock_quote: 1 call(s) → 0.0010 USDC
   Total: 0.0210 USDC
──────────────────────────────────────────────────────────────
```

---

## Public endpoints (no payment needed)

| Endpoint | Description |
|---|---|
| `GET /` | Service catalog + pricing |
| `GET /transactions` | Live transaction feed (for dashboard) |
| `GET /stats` | Aggregate usage stats |

---

## Roadmap

- [x] Stellar MPP charge intent — search + finance
- [x] x402 search route
- [x] Claude agent with autonomous payment
- [ ] Next.js dashboard with live transaction feed
- [ ] Stellar MPP session intent (payment channels for high-frequency calls)
- [ ] MCP server — expose tools to any MCP-compatible agent (Claude Code, Codex)
- [ ] Service registry / discovery endpoint
- [ ] Mainnet deployment

---

## Why Stellar

- **$0.00001 per transaction** — micropayments are actually viable
- **5-second settlement** — fast enough for synchronous HTTP requests
- **Native USDC** — no bridging required
- **99.99% uptime** — reliable for 24/7 autonomous agents

---

## Hackathon

**Stellar Hacks: Agents** · [dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp)

Prize pool: $10,000 USD · Deadline: April 13, 2026
