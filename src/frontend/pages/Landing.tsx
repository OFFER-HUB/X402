import { useState } from 'react'
import { GL } from '../components/gl/index.js'
import { Header } from '../components/header.js'
import { Pill } from '../components/pill.js'
import { Button } from '../components/ui/button.js'

const SERVICES = [
  {
    icon: '⌕',
    name: 'Web Search',
    endpoint: 'GET /search',
    cost: '0.01 USDC',
    desc: 'Real-time search via Brave API with Jina AI fallback. Ranked results with titles, URLs, and descriptions.',
    href: '/dashboard?tab=search',
    color: '#a78bfa',
  },
  {
    icon: '◉',
    name: 'Finance Quotes',
    endpoint: 'GET /finance/quote',
    cost: '0.001 USDC',
    desc: 'Real-time stock prices, market cap, volume, and change % for any publicly traded ticker.',
    href: '/dashboard?tab=finance',
    color: '#4ade80',
  },
  {
    icon: '◆',
    name: 'AI Inference',
    endpoint: 'POST /inference',
    cost: '0.005 USDC',
    desc: 'Per-prompt inference with primary and fallback model providers. Returns text and token usage.',
    href: '/dashboard?tab=inference',
    color: '#fbbf24',
  },
  {
    icon: '⬡',
    name: 'Session Search',
    endpoint: 'POST /session/search',
    cost: '0.01 USDC / query',
    desc: 'One on-chain deposit, unlimited off-chain queries. Settle at the end. Built for batch agent jobs.',
    href: '/dashboard?tab=session',
    color: '#FFC700',
  },
]

const STEPS = [
  { num: '01', title: 'Agent calls an endpoint', body: 'The agent makes a normal HTTP request. No API key, no auth header.' },
  { num: '02', title: 'Server returns 402', body: 'Metered responds with a Stellar MPP or x402 payment challenge instead of the data.' },
  { num: '03', title: 'SDK pays, request retries', body: 'The Mppx SDK intercepts the 402, signs a micro-payment from the agent wallet, and retries automatically.' },
  { num: '04', title: 'Data delivered', body: 'Payment verified on-chain. Response returned. Total time: one HTTP round-trip.' },
]

const WHY = [
  { icon: '◈', title: 'No subscriptions',   body: 'Pay per request in USDC micro-payments. No monthly fees.' },
  { icon: '⌁', title: 'No API keys',         body: 'The Stellar wallet is the identity. Payment is the authentication.' },
  { icon: '⟳', title: 'No human in loop',    body: 'Agents discover, evaluate, and pay for services on their own.' },
  { icon: '⊕', title: 'Multiple providers',  body: 'Agents compare price and quality across providers autonomously.' },
]

export function Landing() {
  const [hovering, setHovering] = useState(false)

  return (
    <>
      <GL hovering={hovering} />
      <Header />

      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100svh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ maxWidth: '680px', width: '100%' }}>
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'center' }}>
            <Pill>TESTNET LIVE</Pill>
          </div>

          <h1
            className="font-sentient"
            style={{
              fontWeight: 200,
              fontSize: 'clamp(2.75rem, 7vw, 4.75rem)',
              lineHeight: 1.08,
              color: '#ffffff',
              letterSpacing: '-0.025em',
            }}
          >
            Where AI agents
            <br />
            <i style={{ fontStyle: 'italic', fontWeight: 300 }}>go to spend money.</i>
          </h1>

          <p
            className="font-mono"
            style={{
              fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.82)',
              marginTop: '2rem',
              maxWidth: '480px',
              marginInline: 'auto',
            }}
          >
            Autonomous pay-per-use APIs powered by Stellar MPP and x402.
            <br />
            No subscriptions. No API keys. No human in the loop.
          </p>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard" style={{ display: 'inline-block' }}>
              <Button onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
                [Launch App]
              </Button>
            </a>
            <a
              href="#services"
              className="font-mono"
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              Explore services ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section
        id="services"
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#FFC700',
            display: 'block',
            marginBottom: '1.25rem',
          }}
        >
          Services
        </span>

        <h2
          className="font-sentient"
          style={{
            fontWeight: 200,
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: 1.15,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          APIs agents actually
          <i style={{ fontStyle: 'italic' }}> need.</i>
        </h2>

        <p
          className="font-mono"
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.78)',
            maxWidth: '480px',
            marginInline: 'auto',
            marginBottom: '3.5rem',
          }}
        >
          Each service is priced per call in USDC micro-payments.
          Every response includes the receipt.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1px',
            maxWidth: '1000px',
            marginInline: 'auto',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {SERVICES.map((svc) => (
            <a
              key={svc.name}
              href={svc.href}
              style={{
                display: 'block',
                padding: '2rem 1.75rem',
                background: 'rgba(0,0,0,0.45)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none',
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.62)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            >
              <div style={{ fontSize: '1.4rem', color: svc.color, marginBottom: '1rem' }}>{svc.icon}</div>

              <div
                className="font-mono"
                style={{
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.62)',
                  marginBottom: '0.35rem',
                }}
              >
                {svc.endpoint}
              </div>

              <div
                className="font-sentient"
                style={{
                  fontWeight: 200,
                  fontSize: '1.05rem',
                  color: '#fff',
                  marginBottom: '0.5rem',
                }}
              >
                {svc.name}
              </div>

              <div
                className="font-mono"
                style={{
                  fontSize: '0.72rem',
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.75)',
                  marginBottom: '1.25rem',
                }}
              >
                {svc.desc}
              </div>

              <span
                className="font-mono"
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: svc.color,
                  background: `${svc.color}18`,
                  border: `1px solid ${svc.color}30`,
                  borderRadius: '3px',
                  padding: '2px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {svc.cost}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how"
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#FFC700',
            display: 'block',
            marginBottom: '1.25rem',
          }}
        >
          How it works
        </span>

        <h2
          className="font-sentient"
          style={{
            fontWeight: 200,
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: 1.15,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '3.5rem',
          }}
        >
          One HTTP call.
          <i style={{ fontStyle: 'italic' }}> Zero friction.</i>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem 2rem',
            maxWidth: '900px',
            marginInline: 'auto',
            textAlign: 'left',
            marginBottom: '4rem',
          }}
        >
          {STEPS.map((step) => (
            <div key={step.num}>
              <div
                className="font-mono"
                style={{ fontSize: '0.68rem', color: '#FFC700', opacity: 0.5, marginBottom: '0.75rem' }}
              >
                {step.num}
              </div>
              <h3
                className="font-sentient"
                style={{ fontWeight: 200, fontSize: '1rem', color: '#fff', marginBottom: '0.5rem' }}
              >
                {step.title}
              </h3>
              <p
                className="font-mono"
                style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.38)' }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* Code block */}
        <div
          style={{
            maxWidth: '640px',
            marginInline: 'auto',
            textAlign: 'left',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '1.5rem 1.75rem',
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '0.62rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.52)',
              marginBottom: '1rem',
            }}
          >
            Agent example
          </div>
          <pre
            className="font-mono"
            style={{
              fontSize: '0.78rem',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.82)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >{`// One-time setup: patch fetch() with your Stellar wallet
Mppx.create({ methods: [stellar.charge({ keypair })] })

// Call any Metered endpoint normally
const res = await fetch('/search?q=nvidia earnings')
// ↑ 402 intercepted → micro-payment signed → request retried

const { results } = await res.json()
// Done. No API key. No billing portal.`}</pre>
        </div>
      </section>

      {/* ── Why Metered ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#FFC700',
            display: 'block',
            marginBottom: '1.25rem',
          }}
        >
          Why Metered
        </span>

        <h2
          className="font-sentient"
          style={{
            fontWeight: 200,
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: 1.15,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '3.5rem',
          }}
        >
          Built for agents,
          <i style={{ fontStyle: 'italic' }}> not humans.</i>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            maxWidth: '840px',
            marginInline: 'auto',
          }}
        >
          {WHY.map((item) => (
            <div key={item.title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1rem' }}>{item.icon}</div>
              <h3
                className="font-sentient"
                style={{ fontWeight: 200, fontSize: '1rem', color: '#fff', marginBottom: '0.5rem' }}
              >
                {item.title}
              </h3>
              <p
                className="font-mono"
                style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.38)' }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)',
          textAlign: 'center',
        }}
      >
        <h2
          className="font-sentient"
          style={{
            fontWeight: 200,
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: 1.15,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          Ready to let your agent
          <br />
          <i style={{ fontStyle: 'italic' }}>transact autonomously?</i>
        </h2>

        <p
          className="font-mono"
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '400px',
            marginInline: 'auto',
            marginBottom: '2.5rem',
          }}
        >
          Fund a Stellar testnet wallet and your agent can start paying for services immediately.
        </p>

        <a href="/dashboard" style={{ display: 'inline-block' }}>
          <Button onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
            [Launch App]
          </Button>
        </a>

        {/* Footer links */}
        <div
          style={{
            marginTop: 'clamp(3rem, 6vw, 5rem)',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            maxWidth: '900px',
            marginInline: 'auto',
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.18)' }}
          >
            Metered — Agent Economy Layer
          </span>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Search', 'Finance', 'Inference', 'Session', 'Dashboard'].map((item) => (
              <a
                key={item}
                href={`/dashboard${item === 'Dashboard' ? '' : `?tab=${item.toLowerCase()}`}`}
                className="font-mono"
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.52)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
