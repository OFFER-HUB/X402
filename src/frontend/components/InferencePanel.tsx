import { useState, type FormEvent } from 'react'
import { useInference } from '../hooks/index.js'
import type { WalletState } from '../contexts/WalletContext.js'

interface Props {
  baseUrl: string
  wallet:  WalletState
}

const EXAMPLES = [
  'Explain Stellar MPP in one sentence.',
  'What is the x402 payment standard?',
  'How do AI agents pay for services autonomously?',
]

export function InferencePanel({ baseUrl, wallet }: Props) {
  const [prompt, setPrompt] = useState('')
  const { data, status, error, infer } = useInference(baseUrl)

  const hasUsdc = wallet.usdcBalance && parseFloat(wallet.usdcBalance) > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await infer(prompt)
  }

  return (
    <div className="two-col">
      {/* ── Input panel ── */}
      <div className="panel">
        <div className="panel-header">
          <span>◆</span>
          <h3>AI Inference</h3>
          <span className="panel-cost">0.005 USDC / prompt</span>
        </div>
        <div className="panel-body">

          {!hasUsdc && (
            <div style={{
              background: 'rgba(251,191,36,0.07)',
              border: '1px solid rgba(251,191,36,0.22)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 12,
              color: 'var(--muted-light)',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: '#fbbf24' }}>Payment required</strong> — costs 0.005 USDC via Stellar MPP.
              {' '}Run{' '}
              <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 11 }}>npm run agent</code>
              {' '}to auto-pay.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Enter a prompt…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={status === 'loading'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn"
                disabled={status === 'loading' || !prompt.trim()}
              >
                {status === 'loading' ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Examples</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {EXAMPLES.map((p) => (
                <button
                  key={p}
                  className="btn btn-outline"
                  style={{ textAlign: 'left', fontSize: 12, padding: '6px 10px' }}
                  onClick={() => setPrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {status === 'error' && error?.includes('402') && (
            <div className="status-402" style={{ marginTop: 10 }}>
              402 — server requires Stellar MPP payment. Run{' '}
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>npm run agent</code> to auto-pay.
            </div>
          )}
          {status === 'error' && error && !error.includes('402') && (
            <div className="status-error" style={{ marginTop: 10 }}>{error}</div>
          )}

          {data && (
            <div>
              <div className="inference-response">{data.text}</div>
              <div className="inference-meta">
                <span>model: {data.model}</span>
                <span>tokens: {data.usage.total_tokens}</span>
                <span>via {data.source}</span>
                <span style={{ color: 'var(--green)' }}>−0.005 USDC</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Info panel ── */}
      <div className="panel">
        <div className="panel-header">
          <h3>How payment works</h3>
        </div>
        <div className="panel-body">
          <div className="result-block">
            <div className="result-title">Endpoint</div>
            <div className="result-url">POST /inference</div>
            <div className="result-desc">
              Body: <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{'{ prompt, model? }'}</code>
              {' '}— 0.005 USDC per call
            </div>
          </div>
          <div className="result-block">
            <div className="result-title">Providers</div>
            <div className="result-desc">
              Primary model with OpenRouter fallback. Per-prompt pricing — agents pay only
              for the tokens they consume.
            </div>
          </div>
          <div className="result-block">
            <div className="result-title">Agent use case</div>
            <div className="result-desc">
              Agents call external AI mid-task without managing API keys or subscriptions.
              The Stellar payment settles in real time.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
