import * as React from 'react'
import { cn } from '../../lib/utils.js'
import { px } from '../utils.js'

interface ButtonProps extends React.ComponentProps<'button'> {
  size?: 'default' | 'sm'
}

export function Button({ className, size = 'default', children, ...props }: ButtonProps) {
  const polyRoundness = 16
  const hypotenuse = polyRoundness * 2
  const hypotenuseHalf = polyRoundness / 2 - 1.5

  return (
    <button
      style={{ '--poly-roundness': px(polyRoundness) } as React.CSSProperties}
      className={cn(
        'inline-flex relative uppercase border font-mono cursor-pointer items-center font-medium justify-center gap-2 whitespace-nowrap ease-out transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none',
        'bg-background border-primary text-primary [&>[data-border]]:bg-primary',
        '[box-shadow:inset_0_0_54px_0px_#EBB800] hover:[box-shadow:inset_0_0_54px_0px_#EBB80099]',
        '[clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_0,100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,0_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))]',
        size === 'default' ? 'h-16 px-6 text-base' : 'h-14 px-6 text-sm',
        className,
      )}
      {...props}
    >
      <span
        data-border="top-left"
        style={{ '--h': px(hypotenuse), '--hh': px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2"
      />
      <span
        data-border="bottom-right"
        style={{ '--h': px(hypotenuse), '--hh': px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] -rotate-45 translate-x-1/2"
      />
      {children}
    </button>
  )
}
