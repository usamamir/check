import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { bootstrapDb } from '@/db/bootstrap'

function DatabaseGate({ children }: { children: ReactNode }): JSX.Element {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    bootstrapDb()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to open local database')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-danger">Database error</h1>
          <p className="mt-2 max-w-md text-sm text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-accent/30" />
          <p className="text-sm text-muted">Loading FORGE…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function AppProviders({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <DatabaseGate>{children}</DatabaseGate>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
