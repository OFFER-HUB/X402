// ── Shared API response types ────────────────────────────────────────────────

export interface Transaction {
  id: string
  service: string
  amount: string
  query: string
  txHash?: string
  timestamp: string
}

export interface Stats {
  totalUsdc: string
  totalCalls: number
  services: Record<string, { calls: number; usdc: number }>
}

export interface SearchResult {
  title: string
  url: string
  description: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  source: 'brave' | 'jina'
  timestamp: string
}

export interface FinanceQuoteResponse {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  currency: string
  timestamp: string
}

export interface InferenceResponse {
  model: string
  prompt: string
  text: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  source: string
  timestamp: string
}

export interface SessionOpenResponse {
  sessionId: string
  depositAmount: string
  status: 'open'
  openedAt: string
}

export interface SessionEvent {
  type: 'opened' | 'used' | 'closed' | 'settled'
  timestamp: string
  detail: string
}

export interface SessionRecord {
  sessionId: string
  agentPublicKey: string
  depositAmount: string
  usedAmount: string
  requestCount: number
  status: 'open' | 'closed' | 'settled'
  openedAt: string
  closedAt?: string
  events: SessionEvent[]
}

export interface SessionSearchResponse extends SearchResponse {
  session: {
    sessionId: string
    requestCount: number
    usedAmount: string
  }
}

export interface SessionCloseResponse {
  sessionId: string
  status: 'settled'
  requestCount: number
  totalCharged: string
}

// ── SSE event shapes ─────────────────────────────────────────────────────────

export type SSEMessage =
  | { type: 'init'; transactions: Transaction[]; stats: Stats }
  | { type: 'tx'; transaction: Transaction; stats: Stats }
  | { type: 'ping' }

// ── Hook state shapes ────────────────────────────────────────────────────────

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: FetchStatus
  error: string | null
}
