export interface StockQuote {
  symbol: string
  name: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  volume: number | null
  marketCap: number | null
  currency: string | null
  timestamp: string
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const ticker = symbol.toUpperCase()
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; stockbot/1.0)' },
  })
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${ticker}`)
  const data = (await res.json()) as any
  const result = data.chart?.result?.[0]
  if (!result) throw new Error(`No data found for symbol: ${ticker}`)
  const meta = result.meta
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null
  const price: number | null = meta.regularMarketPrice ?? null
  const change = price !== null && prevClose != null ? price - prevClose : null
  const changePercent = change !== null && prevClose ? (change / prevClose) * 100 : null
  return {
    symbol: meta.symbol ?? ticker,
    name: null, // v8 chart endpoint doesn't return company name
    price,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? null,
    marketCap: null, // not available in v8 chart endpoint
    currency: meta.currency ?? null,
    timestamp: new Date().toISOString(),
  }
}
