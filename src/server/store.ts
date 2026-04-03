// In-memory transaction log for the dashboard
export interface Transaction {
  id: string
  service: string
  amount: string
  query: string
  timestamp: string
}

const transactions: Transaction[] = []

export function logTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
  transactions.unshift({
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    ...tx,
  })
  // Keep last 100
  if (transactions.length > 100) transactions.pop()
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
  return { totalUsdc: totalUsdc.toFixed(4), totalCalls: transactions.length, services: totals }
}
