import { Mppx, stellar } from '@stellar/mpp/charge/server'
import {
  USDC_SAC_TESTNET,
  USDC_SAC_MAINNET,
  STELLAR_TESTNET,
  STELLAR_PUBNET,
} from '@stellar/mpp'
import { network } from './mpp.js'

const mppNetwork = network === 'mainnet' ? STELLAR_PUBNET : STELLAR_TESTNET
const currency = network === 'mainnet' ? USDC_SAC_MAINNET : USDC_SAC_TESTNET

export const mppSession = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY!,
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_RECIPIENT!,
      currency,
      network: mppNetwork,
    }),
  ],
})

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

export interface SessionEvent {
  type: 'opened' | 'used' | 'closed' | 'settled'
  timestamp: string
  detail: string
}

const sessions = new Map<string, SessionRecord>()

export function createSession(sessionId: string, agentPublicKey: string, depositAmount: string): SessionRecord {
  const record: SessionRecord = {
    sessionId, agentPublicKey, depositAmount,
    usedAmount: '0', requestCount: 0, status: 'open',
    openedAt: new Date().toISOString(),
    events: [{ type: 'opened', timestamp: new Date().toISOString(), detail: `Session opened with deposit of ${depositAmount} stroops` }],
  }
  sessions.set(sessionId, record)
  return record
}

export function recordUsage(sessionId: string, commitmentAmount: string): SessionRecord | null {
  const record = sessions.get(sessionId)
  if (!record || record.status !== 'open') return null
  record.usedAmount = commitmentAmount
  record.requestCount += 1
  record.events.push({ type: 'used', timestamp: new Date().toISOString(), detail: `Request #${record.requestCount} — cumulative: ${commitmentAmount} stroops` })
  return record
}

export function closeSession(sessionId: string): SessionRecord | null {
  const record = sessions.get(sessionId)
  if (!record || record.status !== 'open') return null
  record.status = 'closed'
  record.closedAt = new Date().toISOString()
  record.events.push({ type: 'closed', timestamp: new Date().toISOString(), detail: `Session closed after ${record.requestCount} requests` })
  return record
}

export function markSettled(sessionId: string): SessionRecord | null {
  const record = sessions.get(sessionId)
  if (!record) return null
  record.status = 'settled'
  record.events.push({ type: 'settled', timestamp: new Date().toISOString(), detail: `Settled — claimed ${record.usedAmount} stroops` })
  return record
}

export function getSession(sessionId: string): SessionRecord | undefined {
  return sessions.get(sessionId)
}

export function getAllSessions(): SessionRecord[] {
  return Array.from(sessions.values())
}
