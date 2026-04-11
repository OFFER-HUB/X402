/**
 * test-frontend-wallet.ts
 * Mirrors the exact flow used by src/frontend/contexts/WalletContext.tsx
 * to verify the trustline + XLM→USDC swap works for a freshly funded wallet.
 *
 * Usage: npx tsx scripts/test-frontend-wallet.ts
 */
import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk'

const HORIZON         = 'https://horizon-testnet.stellar.org'
const FRIENDBOT       = 'https://friendbot.stellar.org'
const USDC_ISSUER     = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const XLM_TO_SWAP     = '9500'
const USDC_MIN_RECEIVE = '1'
const USDC = new Asset('USDC', USDC_ISSUER)
const horizon = new Horizon.Server(HORIZON)

async function fetchBalances(pk: string) {
  const res = await fetch(`${HORIZON}/accounts/${pk}`)
  if (!res.ok) return { xlm: null, usdc: null }
  const data: any = await res.json()
  const xlm  = data.balances.find((b: any) => b.asset_type === 'native')?.balance ?? null
  const usdc = data.balances.find(
    (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER,
  )?.balance ?? null
  return { xlm, usdc }
}

async function fundViaFriendbot(pk: string) {
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pk)}`)
  if (!res.ok) throw new Error(`Friendbot failed: ${res.status}`)
}

async function addUsdcTrustline(kp: Keypair) {
  const account = await horizon.loadAccount(kp.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(30)
    .build()
  tx.sign(kp)
  await horizon.submitTransaction(tx)
}

async function swapXlmToUsdc(kp: Keypair) {
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
        destAsset:   USDC,
        destMin:     USDC_MIN_RECEIVE,
        path:        [],
      }),
    )
    .setTimeout(30)
    .build()
  tx.sign(kp)
  await horizon.submitTransaction(tx)
}

async function main() {
  const kp = Keypair.random()
  console.log('1. Generated keypair')
  console.log('   public:', kp.publicKey())
  console.log('   secret:', kp.secret())

  console.log('\n2. Funding via Friendbot...')
  await fundViaFriendbot(kp.publicKey())
  await new Promise((r) => setTimeout(r, 2000))
  let bal = await fetchBalances(kp.publicKey())
  console.log('   XLM:', bal.xlm, '  USDC:', bal.usdc)

  console.log('\n3. Adding USDC trustline...')
  await addUsdcTrustline(kp)
  bal = await fetchBalances(kp.publicKey())
  console.log('   XLM:', bal.xlm, '  USDC:', bal.usdc)

  console.log('\n4. Swapping XLM → USDC on Stellar testnet DEX...')
  await swapXlmToUsdc(kp)
  bal = await fetchBalances(kp.publicKey())
  console.log('   XLM:', bal.xlm, '  USDC:', bal.usdc)

  if (bal.usdc && parseFloat(bal.usdc) > 0) {
    console.log('\n✅ SWAP SUCCESS — wallet now holds USDC')
  } else {
    console.log('\n❌ SWAP FAILED — wallet has 0 USDC')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('\n❌', err.message ?? err)
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2))
  process.exit(1)
})
