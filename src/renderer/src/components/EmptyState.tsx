import type { JSX } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center',
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-accent/20 blur-2xl" aria-hidden />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-raised shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)]">
          <Icon className="h-7 w-7 text-accent" strokeWidth={1.75} />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold tracking-wide text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  )
}
