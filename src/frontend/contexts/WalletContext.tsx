import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'metered:demo:secret'
const HORIZON       = 'https://horizon-testnet.stellar.org'
const FRIENDBOT     = 'https://friendbot.stellar.org'
const USDC_ISSUER   = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// ── Types ─────────────────────────────────────────────────────────────────────
export type WalletStatus = 'idle' | 'generating' | 'funding' | 'ready' | 'error'

export interface WalletState {
  publicKey:   string | null
  secretKey:   string | null
  xlmBalance:  string | null
  usdcBalance: string | null
  status:      WalletStatus
  error:       string | null
  /** Re-fetch balances from Horizon */
  refresh:     () => Promise<void>
  /** Wipe wallet from localStorage and start fresh */
  reset:       () => void
}

const DEFAULT: WalletState = {
  publicKey: null, secretKey: null,
  xlmBalance: null, usdcBalance: null,
  status: 'idle', error: null,
  refresh: async () => {}, reset: () => {},
}

// ── Context ───────────────────────────────────────────────────────────────────
const WalletContext = createContext<WalletState>(DEFAULT)
export const useWallet = () => useContext(WalletContext)

// ── Helpers (no top-level SDK import — avoids Vite/browser bundling issues) ──
async function generateKeypair(): Promise<{ publicKey: string; secretKey: string }> {
  // Dynamic import so Vite can tree-shake / polyfill properly
  const { Keypair } = await import('@stellar/stellar-sdk')
  const kp = Keypair.random()
  return { publicKey: kp.publicKey(), secretKey: kp.secret() }
}

async function publicKeyFromSecret(secret: string): Promise<string> {
  const { Keypair } = await import('@stellar/stellar-sdk')
  return Keypair.fromSecret(secret).publicKey()
}

async function fetchBalances(pk: string): Promise<{ xlm: string | null; usdc: string | null }> {
  try {
    const res = await fetch(`${HORIZON}/accounts/${pk}`)
    if (!res.ok) return { xlm: null, usdc: null }
    const data = await res.json()
    const balances: any[] = data.balances ?? []
    const xlm  = balances.find((b) => b.asset_type === 'native')?.balance ?? null
    const usdc = balances.find(
      (b) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER,
    )?.balance ?? null
    return { xlm, usdc }
  } catch {
    return { xlm: null, usdc: null }
  }
}

async function fundViaFriendbot(pk: string): Promise<boolean> {
  try {
    const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pk)}`)
    return res.ok
  } catch {
    return false
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey,   setPublicKey]   = useState<string | null>(null)
  const [secretKey,   setSecretKey]   = useState<string | null>(null)
  const [xlmBalance,  setXlmBalance]  = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [status,      setStatus]      = useState<WalletStatus>('idle')
  const [error,       setError]       = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!publicKey) return
    const { xlm, usdc } = await fetchBalances(publicKey)
    setXlmBalance(xlm)
    setUsdcBalance(usdc)
  }, [publicKey])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPublicKey(null); setSecretKey(null)
    setXlmBalance(null); setUsdcBalance(null)
    setStatus('idle'); setError(null)
    window.location.reload()
  }, [])

  useEffect(() => {
    ;(async () => {
      setStatus('generating')
      setError(null)
      try {
        // 1 — Load or generate keypair
        let secret = localStorage.getItem(STORAGE_KEY)
        let pk: string

        if (secret) {
          pk = await publicKeyFromSecret(secret)
        } else {
          setStatus('generating')
          const kp = await generateKeypair()
          secret = kp.secretKey
          pk     = kp.publicKey
          localStorage.setItem(STORAGE_KEY, secret)

          // 2 — Fund new wallet via Friendbot (XLM)
          setStatus('funding')
          await fundViaFriendbot(pk)
          // Allow Horizon time to index the new account
          await new Promise((r) => setTimeout(r, 2000))
        }

        setPublicKey(pk)
        setSecretKey(secret)

        // 3 — Fetch balances
        const { xlm, usdc } = await fetchBalances(pk)
        setXlmBalance(xlm)
        setUsdcBalance(usdc)
        setStatus('ready')
      } catch (err: any) {
        setStatus('error')
        setError(err.message ?? 'Wallet setup failed')
      }
    })()
  }, [])

  return (
    <WalletContext.Provider value={{
      publicKey, secretKey, xlmBalance, usdcBalance, status, error, refresh, reset,
    }}>
      {children}
    </WalletContext.Provider>
  )
}
