import type { JSX, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StepShellProps {
  title: string
  description: string
  children: ReactNode
}

export function StepShell({ title, description, children }: StepShellProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mx-auto w-full max-w-2xl"
    >
      <h2 className="font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted md:text-base">{description}</p>
      <div className="mt-8">{children}</div>
    </motion.div>
  )
}
