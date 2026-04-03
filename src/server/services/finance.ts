import yahooFinance from 'yahoo-finance2'

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
  // @ts-ignore — yahoo-finance2 typings don't expose static .quote() directly
  const quote = await yahooFinance.quote(symbol.toUpperCase())
  return {
    symbol: quote.symbol,
    name: (quote.longName ?? quote.shortName) as string | null,
    price: (quote.regularMarketPrice ?? null) as number | null,
    change: (quote.regularMarketChange ?? null) as number | null,
    changePercent: (quote.regularMarketChangePercent ?? null) as number | null,
    volume: (quote.regularMarketVolume ?? null) as number | null,
    marketCap: (quote.marketCap ?? null) as number | null,
    currency: (quote.currency ?? null) as string | null,
    timestamp: new Date().toISOString(),
  }
}
