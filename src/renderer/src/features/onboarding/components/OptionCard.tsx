import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  badge?: string
  icon?: ReactNode
  className?: string
}

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  badge,
  icon,
  className
}: OptionCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border px-4 py-4 text-left transition-all duration-150',
        selected
          ? 'border-accent/50 bg-accent-soft shadow-[0_0_0_1px_rgb(198_255_61_/_0.15)]'
          : 'border-border bg-surface-raised/50 hover:border-border-strong hover:bg-surface-hover',
        className
      )}
    >
      {badge ? (
        <span className="absolute right-3 top-3 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          {badge}
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
      </div>
    </button>
  )
}
