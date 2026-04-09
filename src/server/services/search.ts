export interface SearchResult {
  title: string
  url: string
  description: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  source: 'brave' | 'jina'
  timestamp: string
}

export async function searchWeb(query: string): Promise<SearchResponse> {
  if (process.env.BRAVE_API_KEY) {
    return searchBrave(query)
  }
  return searchJina(query)
}

async function searchBrave(query: string): Promise<SearchResponse> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': process.env.BRAVE_API_KEY!,
    },
  })

  if (!res.ok) throw new Error(`Brave Search error: ${res.status}`)

  const data = (await res.json()) as any
  return {
    query,
    source: 'brave',
    timestamp: new Date().toISOString(),
    results: (data.web?.results ?? []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    })),
  }
}

// Free fallback — no API key needed
async function searchJina(query: string): Promise<SearchResponse> {
  const url = `https://s.jina.ai/${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Return-Format': 'json' },
  })

  if (!res.ok) throw new Error(`Jina search error: ${res.status}`)

  const data = (await res.json()) as any
  const results: SearchResult[] = (data.data ?? []).slice(0, 10).map((r: any) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    description: r.description ?? r.content?.slice(0, 200) ?? '',
  }))

  return { query, source: 'jina', timestamp: new Date().toISOString(), results }
}