import { useState } from 'react'
import { cn } from '../lib/utils.js'

const NAV_ITEMS = [
  { name: 'Search',    href: '/dashboard?tab=search' },
  { name: 'Finance',   href: '/dashboard?tab=finance' },
  { name: 'Inference', href: '/dashboard?tab=inference' },
  { name: 'Dashboard', href: '/dashboard' },
]

export const MobileMenu = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className={cn('lg:hidden p-2 text-white/60 hover:text-white transition-colors', className)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed top-0 left-0 w-full z-40 py-28 px-6 flex flex-col space-y-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-xl font-mono uppercase text-white/60 hover:text-white transition-colors py-2"
              >
                {item.name}
              </a>
            ))}
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="inline-block text-xl font-mono uppercase text-primary hover:text-primary/80 transition-colors py-2 mt-6"
            >
              Launch App
            </a>
          </nav>
        </>
      )}
    </>
  )
}
