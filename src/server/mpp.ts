import { Mppx, stellar } from '@stellar/mpp/charge/server'
import {
  USDC_SAC_TESTNET,
  USDC_SAC_MAINNET,
  STELLAR_TESTNET,
  STELLAR_PUBNET,
} from '@stellar/mpp'

const rawNetwork = process.env.STELLAR_NETWORK ?? 'testnet'
export const network = rawNetwork === 'mainnet' ? 'mainnet' : 'testnet'

const mppNetwork = network === 'mainnet' ? STELLAR_PUBNET : STELLAR_TESTNET
const currency = network === 'mainnet' ? USDC_SAC_MAINNET : USDC_SAC_TESTNET

export const mppx = Mppx.create({
  secretKey: process.env.MPP_SECRET_KEY!,
  methods: [
    stellar.charge({
      recipient: process.env.STELLAR_RECIPIENT!,
      currency,
      network: mppNetwork,
    }),
  ],
})
