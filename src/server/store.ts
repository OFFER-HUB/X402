import { EventEmitter } from 'events'

// ── Event emitter for real-time dashboard updates ─────────────────────────────
export const txEvents = new EventEmitter()

// ── Transaction interface ─────────────────────────────────────────────────────
export interface Transaction {
  id: string
  service: string
  amount: string
  query: string
  txHash?: string   // Stellar tx hash for explorer link
  timestamp: string
}

const transactions: Transaction[] = []

export function logTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
  const full: Transaction = {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    ...tx,
  }
  transactions.unshift(full)
  if (transactions.length > 100) transactions.pop()
  txEvents.emit('new', full)
}

export function getTransactions() {
  return transactions
}

export function getStats() {
  const totals: Record<string, { calls: number; usdc: number }> = {}
  for (const tx of transactions) {
    if (!totals[tx.service]) totals[tx.service] = { calls: 0, usdc: 0 }
    totals[tx.service].calls++
    totals[tx.service].usdc += parseFloat(tx.amount)
  }
  const totalUsdc = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  return {
    totalUsdc: totalUsdc.toFixed(4),
    totalCalls: transactions.length,
    services: totals,
  }
}