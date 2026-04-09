export interface InferenceResult {
  model: string
  prompt: string
  text: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  source: 'groq' | 'mock'
  timestamp: string
}

export async function runInference(
  prompt: string,
  model?: string,
): Promise<InferenceResult> {
  if (process.env.GROQ_API_KEY) {
    return runGroq(prompt, model)
  }
  return runMock(prompt, model)
}

async function runGroq(prompt: string, model?: string): Promise<InferenceResult> {
  const selectedModel = model ?? 'llama-3.1-8b-instant'
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as any
  const choice = data.choices?.[0]

  return {
    model: data.model ?? selectedModel,
    prompt,
    text: choice?.message?.content ?? '',
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
    source: 'groq',
    timestamp: new Date().toISOString(),
  }
}

// Graceful fallback when GROQ_API_KEY is not set
function runMock(prompt: string, model?: string): InferenceResult {
  return {
    model: model ?? 'llama-3.1-8b-instant',
    prompt,
    text: '[GROQ_API_KEY not configured — set it in .env to enable real inference]',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    source: 'mock',
    timestamp: new Date().toISOString(),
  }
}