import type { JSX } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppShell(): JSX.Element {
  const location = useLocation()

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255_/_0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255_/_0.02)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40"
          aria-hidden
        />
        <ScrollArea className="relative h-full">
          <div className="mx-auto min-h-full w-full max-w-6xl px-6 py-6 md:px-8 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
