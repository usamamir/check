import type { JSX } from 'react'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WhyThisPopover({ reasoning }: { reasoning: string }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted hover:bg-surface-hover hover:text-accent"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Why this?
      </button>
      {open ? (
        <div
          className={cn(
            'absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-surface-raised p-3 text-xs leading-relaxed text-muted shadow-xl'
          )}
        >
          {reasoning}
        </div>
      ) : null}
    </div>
  )
}
