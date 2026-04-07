# CLAUDE.md — AI Context for Metered

This file gives AI assistants (Claude, Codex, etc.) full context on what we're building and how to contribute effectively.

---

## What is this project

**Metered** is the economic layer for machine-to-machine services.

One-liner: *"Where AI agents go to spend money."*

AI agents can reason and execute — but they cannot transact. Every service they need (search, data, compute) is locked behind human-centric billing. Metered solves this: agents discover, evaluate, and pay for services autonomously using Stellar MPP and x402, with no subscriptions, no API keys, no human in the loop.

Key differentiator: **multiple providers per service**. Agents don't just pay — they compare price and quality across providers and make autonomous economic decisions.

We're building this for the **Stellar Hacks: Agents hackathon** (deadline: April 13, 2026, prize: $10,000).

The core insight: the payment rails exist (Stellar MPP, x402) but the economic layer on top — discovery, evaluation, autonomous selection — does not. We're building that layer, starting with real services agents need today.

---

## Current state

### What's built
- Hono HTTP server with MPP-gated routes (`/search`, `/finance/quote`)
- x402 route (`/x402/search`) — same service, different payment protocol
- Web search service: Brave Search API (with key) or Jina AI (free fallback)
- Finance service: yahoo-finance2 for real-time stock quotes
- In-memory transaction store for dashboard consumption
- Claude agent demo that pays autonomously via Stellar MPP

### What's NOT built yet (next priorities)
1. **Next.js dashboard** — live transaction feed, spending stats, service catalog UI
2. **MPP Session intent** — payment channels for high-frequency calls (currently only Charge intent)
3. **MCP server** — expose /search and /finance as MCP tools so Claude Code / Codex can use them directly
4. **Testnet to mainnet** — currently testnet only

---

## Tech stack

| Layer | Tech | Why |
|---|---|---|
| HTTP server | Hono + @hono/node-server | Native Web API Request/Response — required by @stellar/mpp |
| Payments (primary) | @stellar/mpp (Charge intent) | Stellar's official MPP SDK, just launched |
| Payments (secondary) | x402 (HTTP 402 standard) | Coinbase/Cloudflare standard, cross-chain |
| AI agent | @anthropic-ai/sdk (claude-sonnet-4-6) | Tool use + autonomous payment loop |
| Search | Brave Search API / Jina AI | Brave as primary, Jina as free fallback |
| Finance | yahoo-finance2 | Free, no API key, real-time data |
| Language | TypeScript (ESNext, module: bundler) | Strict mode on |
| Runtime | Node.js 22+ | ESM modules throughout |

---

## Key architectural decisions

### Why Hono instead of Express
The `@stellar/mpp` SDK uses standard Web Fetch API `Request`/`Response` objects. Hono natively works with these — `c.req.raw` gives you the raw `Request`. Express would require manual conversion.

### Why both MPP and x402
- **MPP** (Stellar's protocol) is what the hackathon organizers built and want to see used
- **x402** (Coinbase standard) is the broader ecosystem standard — more tooling, more clients
- Same underlying services, different payment negotiation layer — shows we understand the full space

### MPP Charge intent vs Session intent
Currently using **Charge intent** (per-request on-chain settlement). Session intent (payment channels, off-chain) is better for high-frequency calls but more complex. Implement Session intent after Charge is working end-to-end.

### Search fallback strategy
If `BRAVE_API_KEY` is set → use Brave Search API. Otherwise → use Jina AI (`https://s.jina.ai/`) which is free and requires no key. This means the demo works out of the box without any API keys.

---

## File map

```
src/server/index.ts          # Entry point — mounts all routes
src/server/mpp.ts            # Mppx instance with stellar.charge() configured
src/server/store.ts          # In-memory tx log: logTransaction(), getStats()
src/server/routes/search.ts      # GET /search — MPP gated, 0.01 USDC
src/server/routes/finance.ts     # GET /finance/quote — MPP gated, 0.001 USDC
src/server/routes/search-x402.ts # GET /x402/search — x402 gated, 0.01 USDC
src/server/services/search.ts    # Brave / Jina AI search client
src/server/services/finance.ts   # Yahoo Finance quote client
src/agent/index.ts           # Claude agent — patches fetch() via Mppx client
```

---

## Environment variables

| Var | Required | Description |
|---|---|---|
| `STELLAR_NETWORK` | Yes | `testnet` or `mainnet` |
| `MPP_SECRET_KEY` | Yes | Server wallet secret key (receives payments) |
| `STELLAR_RECIPIENT` | Yes | Server wallet public key |
| `AGENT_SECRET_KEY` | Yes | Agent wallet secret key (sends payments) |
| `BRAVE_API_KEY` | No | If set, uses Brave Search instead of Jina AI |
| `SERVER_URL` | No | Defaults to `http://localhost:3000` |
| `PORT` | No | Defaults to 3000 |

---

## MPP SDK usage pattern

```typescript
// Server side
import { Mppx, stellar } from '@stellar/mpp/charge/server'
import { USDC_SAC_TESTNET, STELLAR_TESTNET } from '@stellar/mpp'

const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY!,
  methods: [stellar.charge({ recipient: '...', currency: USDC_SAC_TESTNET, network: STELLAR_TESTNET })],
})

// In a Hono route handler:
const result = await mppx.charge({ amount: '0.01', description: '...' })(c.req.raw)
if (result.status === 402) return result.challenge   // return 402 to client
return result.withReceipt(Response.json(data))        // return 200 + receipt header
```

```typescript
// Client side (agent)
import { Mppx, stellar } from '@stellar/mpp/charge/client'
Mppx.create({ methods: [stellar.charge({ keypair: Keypair.fromSecret('S...') })] })
// After this, global fetch() automatically handles 402 responses
const res = await fetch('http://localhost:3000/search?q=nvidia')
```

---

## Conventions

- Use `import 'dotenv/config'` at the top of entry points (server + agent)
- All routes use `.js` extension in imports (ESM requirement)
- No `any` types unless unavoidable (yahoo-finance2 typings have issues — `@ts-ignore` is acceptable there)
- `logTransaction()` must be called after every successful paid request
- Keep route handlers thin — business logic lives in `services/`

---

## What to build next (in priority order)

### 1. MCP server (high impact for hackathon demo)
Create `src/mcp/index.ts` that exposes `/search` and `/finance/quote` as MCP tools. Reference: [github.com/jamesbachini/x402-mcp-stellar](https://github.com/jamesbachini/x402-mcp-stellar).

The MCP server should:
- Define tools with proper input schemas
- Call our own server endpoints (with MPP payment handled by the client)
- Work with Claude Code via `claude mcp add`

### 2. Next.js dashboard (high impact for demo video)
`dashboard/` — Next.js app that polls `/transactions` and `/stats` every 2 seconds. Show:
- Live feed of paid transactions (service, amount, timestamp)
- Total USDC processed
- Per-service breakdown
- A "try it" button that triggers the agent demo

### 3. MPP Session intent
Add `src/server/routes/search-session.ts` using `@stellar/mpp/channel/server`. Better for agents making many calls — deposit once, sign commitments off-chain.

### 4. Finance route for x402
Mirror the MPP finance route under `/x402/finance/quote`.

---

## Hackathon context

- **Event:** Stellar Hacks: Agents
- **URL:** dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp
- **Deadline:** April 13, 2026 at 17:00
- **Prize:** $10,000 USD
- **Required deliverables:** GitHub repo + demo video
- **Judging themes:** agents, AI, x402, Stellar, Claude, web3

The winning angle: we're not building payment tooling — we're building actual services that agents want to pay for. The hackathon itself cites "pay-per-query search via Brave" as the strongest concrete demand signal. That's exactly what `/search` does.
