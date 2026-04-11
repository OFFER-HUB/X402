import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'metered:demo:secret'
const HORIZON       = 'https://horizon-testnet.stellar.org'
const FRIENDBOT     = 'https://friendbot.stellar.org'
const USDC_ISSUER   = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
// Friendbot gives 10,000 XLM — keep 500 for fees, swap the rest to USDC
const XLM_TO_SWAP    = '9500'
const USDC_MIN_RECEIVE = '1' // accept any amount ≥ 1 USDC

// ── Types ─────────────────────────────────────────────────────────────────────
export type WalletStatus = 'idle' | 'generating' | 'funding' | 'trustline' | 'swapping' | 'ready' | 'error'

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

/**
 * Add a USDC trustline so the account is allowed to hold USDC.
 * Throws on failure — caller surfaces the error to the UI.
 */
async function addUsdcTrustline(secret: string): Promise<void> {
  const sdk = await import('@stellar/stellar-sdk')
  const { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset } = sdk
  const horizon = new Horizon.Server(HORIZON)
  const kp = Keypair.fromSecret(secret)
  const account = await horizon.loadAccount(kp.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset('USDC', USDC_ISSUER) }))
    .setTimeout(30)
    .build()
  tx.sign(kp)
  await horizon.submitTransaction(tx)
}

/**
 * Patch the global fetch() so any call to a Metered route automatically
 * pays the 402 challenge using this wallet's keypair. Idempotent — safe to
 * call multiple times; only the first call has any effect.
 */
let mppxInitialized = false
async function initMppxClient(secret: string): Promise<void> {
  if (mppxInitialized) return
  const [{ Keypair }, { Mppx, stellar }] = await Promise.all([
    import('@stellar/stellar-sdk'),
    import('@stellar/mpp/charge/client'),
  ])
  Mppx.create({
    methods: [stellar.charge({ keypair: Keypair.fromSecret(secret) })],
  })
  mppxInitialized = true
}

/**
 * Swap XLM → USDC on the Stellar testnet DEX via pathPaymentStrictSend.
 * Sends XLM_TO_SWAP XLM and receives at least USDC_MIN_RECEIVE USDC.
 * Throws on failure — caller surfaces the error to the UI.
 */
async function swapXlmToUsdc(secret: string): Promise<void> {
  const sdk = await import('@stellar/stellar-sdk')
  const { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } = sdk
  const horizon = new Horizon.Server(HORIZON)
  const kp = Keypair.fromSecret(secret)
  const account = await horizon.loadAccount(kp.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset:   Asset.native(),
        sendAmount:  XLM_TO_SWAP,
        destination: kp.publicKey(),
        destAsset:   new Asset('USDC', USDC_ISSUER),
        destMin:     USDC_MIN_RECEIVE,
        path:        [],
      }),
    )
    .setTimeout(30)
    .build()
  tx.sign(kp)
  await horizon.submitTransaction(tx)
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
    // Immediate fetch — picks up the change if Horizon is fast
    const first = await fetchBalances(publicKey)
    setXlmBalance(first.xlm)
    setUsdcBalance(first.usdc)
    // Horizon usually needs 1–2s to index a fresh Soroban tx, so re-fetch.
    await new Promise((r) => setTimeout(r, 1800))
    const second = await fetchBalances(publicKey)
    setXlmBalance(second.xlm)
    setUsdcBalance(second.usdc)
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
        let isNewWallet = false

        if (secret) {
          pk = await publicKeyFromSecret(secret)
        } else {
          setStatus('generating')
          const kp = await generateKeypair()
          secret = kp.secretKey
          pk     = kp.publicKey
          localStorage.setItem(STORAGE_KEY, secret)
          isNewWallet = true

          // 2 — Fund new wallet via Friendbot (XLM)
          setStatus('funding')
          await fundViaFriendbot(pk)
          // Allow Horizon time to index the new account
          await new Promise((r) => setTimeout(r, 2000))
        }

        setPublicKey(pk)
        setSecretKey(secret)

        // 3 — Check current balances; if USDC is missing or 0, run trustline + swap.
        // This also self-heals wallets stored in localStorage from before USDC support.
        let { xlm, usdc } = await fetchBalances(pk)

        if (usdc === null) {
          setStatus('trustline')
          await addUsdcTrustline(secret)
          await new Promise((r) => setTimeout(r, 1500))
          ;({ xlm, usdc } = await fetchBalances(pk))
        }

        if (usdc !== null && parseFloat(usdc) === 0 && xlm !== null && parseFloat(xlm) > parseFloat(XLM_TO_SWAP) + 100) {
          setStatus('swapping')
          await swapXlmToUsdc(secret)
          await new Promise((r) => setTimeout(r, 1500))
          ;({ xlm, usdc } = await fetchBalances(pk))
        }

        // 4 — Verify the swap actually deposited USDC for new wallets
        if (isNewWallet && (usdc === null || parseFloat(usdc) === 0)) {
          throw new Error('XLM → USDC swap completed but wallet still holds 0 USDC')
        }

        // 5 — Boot the Mppx client: patches global fetch() so any /search,
        //     /finance/quote, /inference, /session call from the dashboard
        //     automatically pays the 402 challenge using THIS wallet.
        if (usdc !== null && parseFloat(usdc) > 0) {
          await initMppxClient(secret)
        }

        setXlmBalance(xlm)
        setUsdcBalance(usdc)
        setStatus('ready')
      } catch (err: any) {
        console.error('[wallet] setup failed', err)
        setStatus('error')
        setError(err?.response?.data?.extras?.result_codes
          ? JSON.stringify(err.response.data.extras.result_codes)
          : err?.message ?? 'Wallet setup failed')
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
