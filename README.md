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
- **Multiple providers per service** — agents compare price and quality, then decide
- **Native machine-to-machine** — built on Stellar MPP and x402

---

## Services (MVP)

| Service | Providers | Price |
|---|---|---|
| Web Search | Brave, Jina AI | 0.01 USDC / query |
| Financial Data | Yahoo Finance | 0.001 USDC / quote |
| AI Inference | *(coming)* | per token |

Each service exposes multiple providers. The agent selects based on price, quality, and task requirements — autonomously.

---

## Demo

An agent receives a task and a budget.

It selects providers, allocates spend, executes queries, and pays per request in real time — completing the task within budget, without human intervention.

```
Agent: "Analyze Nvidia as an investment. Budget: 0.10 USDC."

  → web_search("Nvidia earnings 2026")     paid 0.01 USDC  ✓
  → web_search("Nvidia competitor analysis") paid 0.01 USDC ✓
  → get_stock_quote("NVDA")                paid 0.001 USDC ✓

  Total spent: 0.021 USDC
  Report: [generated]
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
Server verifies + returns results
```

No accounts. No API keys. No human in the loop.

---

## Architecture

```
src/
├── server/
│   ├── index.ts              # Hono HTTP server
│   ├── mpp.ts                # Stellar MPP — Charge intent
│   ├── store.ts              # Transaction log
│   ├── routes/
│   │   ├── search.ts         # /search          — MPP, 0.01 USDC
│   │   ├── finance.ts        # /finance/quote   — MPP, 0.001 USDC
│   │   └── search-x402.ts   # /x402/search     — x402, 0.01 USDC
│   └── services/
│       ├── search.ts         # Brave + Jina AI
│       └── finance.ts        # Yahoo Finance
└── agent/
    └── index.ts              # Claude agent — pays autonomously
```

**Stack:** Hono · Stellar MPP (`@stellar/mpp`) · x402 · Claude claude-sonnet-4-6 · TypeScript

---

## Setup

```bash
npm install
cp .env.example .env
```

Generate two Stellar wallets at [lab.stellar.org](https://lab.stellar.org) — one for the server (receives), one for the agent (pays). Fund both with testnet XLM + USDC.

```env
STELLAR_NETWORK=testnet
MPP_SECRET_KEY=S...       # server wallet
STELLAR_RECIPIENT=G...    # server wallet public key
AGENT_SECRET_KEY=S...     # agent wallet
```

```bash
npm run server   # start the API server
npm run agent    # run the demo agent
```

---

## Roadmap

- [x] Stellar MPP — search + finance, Charge intent
- [x] x402 — search route
- [x] Claude agent with autonomous payment loop
- [ ] Dashboard — live transaction feed
- [ ] MCP server — plug into Claude Code / Codex directly
- [ ] Session intent — payment channels for high-frequency calls
- [ ] Provider registry — discovery + quality scoring
- [ ] Mainnet

---

## Vision

AI agents are becoming economic actors.

Metered is not a marketplace. It is the **economic layer for machine-to-machine services** — the infrastructure that lets agents operate with real autonomy, making real economic decisions, with real money.

---

*Built for [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) · Deadline April 13, 2026*
