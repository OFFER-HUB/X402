#!/usr/bin/env tsx
/**
 * Metered MCP Server
 *
 * Exposes Metered services as MCP tools. Any MCP-compatible client
 * (Claude Code, Claude Desktop, Codex) can use them — payment via
 * Stellar MPP is handled transparently.
 *
 * Setup:
 *   claude mcp add metered -- npx tsx src/mcp/index.ts
 *
 * Or in .claude/mcp.json:
 *   {
 *     "mcpServers": {
 *       "metered": {
 *         "command": "npx",
 *         "args": ["tsx", "src/mcp/index.ts"],
 *         "env": { "AGENT_SECRET_KEY": "S...", "SERVER_URL": "http://localhost:3000" }
 *       }
 *     }
 *   }
 */

import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Keypair } from '@stellar/stellar-sdk'
import { Mppx, stellar } from '@stellar/mpp/charge/client'
import { z } from 'zod'

// ── MPP client — patches global fetch() to auto-handle 402 responses ─────────
Mppx.create({
  methods: [stellar.charge({ keypair: Keypair.fromSecret(process.env.AGENT_SECRET_KEY!) })],
})

const BASE_URL = process.env.SERVER_URL || 'http://localhost:3000'

// ── MCP server ─────────────────────────────────────────────────────────────────
const server = new McpServer({
  name: 'metered',
  version: '0.1.0',
})

// Tool: web_search
server.tool(
  'web_search',
  'Search the web for current information. Costs 0.01 USDC per query — payment is handled automatically via Stellar MPP.',
  { query: z.string().describe('The search query') },
  async ({ query }) => {
    try {
      const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) {
        return { content: [{ type: 'text' as const, text: `Search failed: HTTP ${res.status}` }], isError: true }
      }
      const data = await res.json()
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${err.message}` }], isError: true }
    }
  }
)

// Tool: get_stock_quote
server.tool(
  'get_stock_quote',
  'Get real-time stock price and financial data. Costs 0.001 USDC per request — payment via Stellar MPP.',
  { symbol: z.string().describe('Stock ticker symbol, e.g. NVDA, AAPL, TSLA, BTC-USD') },
  async ({ symbol }) => {
    try {
      const res = await fetch(`${BASE_URL}/finance/quote?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) {
        return { content: [{ type: 'text' as const, text: `Quote failed: HTTP ${res.status}` }], isError: true }
      }
      const data = await res.json()
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${err.message}` }], isError: true }
    }
  }
)

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
