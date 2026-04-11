import { getStockQuote } from '../src/server/services/finance.js'
const q = await getStockQuote('NVDA').catch(e => ({ error: e.message }))
console.log(JSON.stringify(q, null, 2))
