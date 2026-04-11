import { Logo } from './logo.js'
import { MobileMenu } from './mobile-menu.js'

const NAV_ITEMS = ['Search', 'Finance', 'Inference', 'Dashboard']

export const Header = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        paddingTop: 'clamp(1.5rem, 3vw, 3.5rem)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1280px',
          marginInline: 'auto',
          paddingInline: 'clamp(1rem, 4vw, 3rem)',
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Logo style={{ width: 'clamp(90px, 10vw, 120px)', height: 'auto' }} />
        </a>

        {/* Desktop nav — centered */}
        <nav
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
          className="max-lg:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255,255,255,0.55)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              href={`/dashboard${item === 'Dashboard' ? '' : `?tab=${item.toLowerCase()}`}`}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA — right */}
        <a
          href="/dashboard"
          className="max-lg:hidden"
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#FFC700',
            textDecoration: 'none',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Launch App
        </a>

        <MobileMenu />
      </header>
    </div>
  )
}
