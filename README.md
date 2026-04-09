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
- **Multiple providers per service** — agents compare price and quality, then decide
- **Native machine-to-machine** — built on Stellar MPP and x402

---

## Services (MVP)

| Service | Providers | Price | Protocol |
|---|---|---|---|
| Web Search | Brave, Jina AI | 0.01 USDC / query | MPP + x402 |
| Financial Data | Yahoo Finance | 0.001 USDC / quote | MPP |
| AI Inference | *(coming)* | per token | MPP |

Each service exposes multiple providers. The agent selects based on price, quality, and task requirements — autonomously.

---

## Demo

An agent receives a task and a budget.

It selects providers, allocates spend, executes queries, and pays per request in real time — completing the task within budget, without human intervention.

```
Agent: "Analyze Nvidia as an investment. Budget: 0.10 USDC."

💳 web_search  |  cost: 0.01 USDC  |  remaining: 0.10 USDC
   {"query":"Nvidia earnings 2026"}
   ✅ paid 0.01 USDC via Stellar MPP

💳 get_stock_quote  |  cost: 0.001 USDC  |  remaining: 0.09 USDC
   {"symbol":"NVDA"}
   ✅ paid 0.001 USDC via Stellar MPP

💰 Spending summary  (budget: 0.10 USDC)
   web_search: 2 call(s)  →  0.0200 USDC
   get_stock_quote: 1 call(s)  →  0.0010 USDC
   Total spent: 0.0210 USDC  /  0.10 USDC
   Remaining:   0.0790 USDC
```

---

## How payments work

```
Agent calls GET /search?q=nvidia
        ↓
Server returns HTTP 402 + payment requirements
        ↓
Agent signs payment on Stellar (< 5 sec, ~$0.00001 fee)
        ↓
Server verifies + returns results with receipt header
```

No accounts. No API keys. No human in the loop.

---

## Architecture

```
src/
├── server/
│   ├── index.ts              # Hono HTTP server
│   ├── mpp.ts                # Stellar MPP — Charge intent
│   ├── store.ts              # Transaction log (feeds dashboard)
│   ├── routes/
│   │   ├── search.ts         # /search          — MPP, 0.01 USDC
│   │   ├── finance.ts        # /finance/quote   — MPP, 0.001 USDC
│   │   └── search-x402.ts   # /x402/search     — x402, 0.01 USDC
│   └── services/
│       ├── search.ts         # Brave Search + Jina AI fallback
│       └── finance.ts        # Yahoo Finance real-time
├── agent/
│   └── index.ts              # Claude agent — budget-aware, pays autonomously
├── mcp/
│   └── index.ts              # MCP server — plug into Claude Code / Codex
└── scripts/
    └── setup-wallets.ts      # One-command testnet wallet setup
```

**Stack:** Hono · Stellar MPP (`@stellar/mpp`) · x402 · Claude claude-sonnet-4-6 · MCP SDK · TypeScript

---

## Setup

```bash
npm install
npm run setup     # generates wallets, funds via Friendbot, writes .env
npm run server    # start the API server
npm run agent     # run the demo agent (default budget: 0.10 USDC)
```

Custom question + budget:
```bash
npm run agent "Is Apple a good buy right now?" 0.05
```

### Connect to Claude Code via MCP

```bash
claude mcp add metered -- npx tsx src/mcp/index.ts
```

Then just ask Claude Code: *"Search for Nvidia news and get the stock price"* — it pays automatically.

### Manual wallet setup (alternative to `npm run setup`)

Generate keypairs at [lab.stellar.org](https://lab.stellar.org), fund with testnet XLM + USDC, then fill `.env`:

```env
STELLAR_NETWORK=testnet
MPP_SECRET_KEY=S...       # server wallet (receives)
STELLAR_RECIPIENT=G...    # server wallet public key
AGENT_SECRET_KEY=S...     # agent wallet (pays)
BRAVE_API_KEY=            # optional — uses Jina AI if not set
```

---

## Roadmap

- [x] Stellar MPP — search + finance, Charge intent
- [x] x402 — search route
- [x] Claude agent with autonomous payment + budget enforcement
- [x] MCP server — `claude mcp add metered`
- [x] One-command wallet setup — `npm run setup`
- [ ] Dashboard — live transaction feed
- [ ] Session intent — payment channels for high-frequency calls
- [ ] Provider quality scoring — agent picks best provider automatically
- [ ] AI Inference route
- [ ] Mainnet

---

## Vision

AI agents are becoming economic actors.

Metered is not a marketplace. It is the **economic layer for machine-to-machine services** — the infrastructure that lets agents operate with real autonomy, making real economic decisions, with real money.

---

*Built for [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) · Deadline April 13, 2026*
