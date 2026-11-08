import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface RestTimerProps {
  seconds: number
  active: boolean
  onDone: () => void
  onSkip: () => void
  onAdjust: (delta: number) => void
}

function RestTimerInner({
  seconds,
  onDone,
  onSkip,
  onAdjust
}: Omit<RestTimerProps, 'active'>): JSX.Element {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    if (left <= 0) {
      onDone()
      return
    }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [left, onDone])

  const pct = seconds > 0 ? left / seconds : 0
  const r = 54
  const c = 2 * Math.PI * r
  const dash = c * pct

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-border bg-surface/95 px-5 py-4 shadow-2xl backdrop-blur">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgb(255 255 255 / 0.08)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#C6FF3D"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl font-bold tabular text-foreground">{left}s</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Rest</div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onAdjust(-15)}>
            −15s
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => onAdjust(15)}>
            +15s
          </Button>
          <Button type="button" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RestTimer({
  seconds,
  active,
  onDone,
  onSkip,
  onAdjust
}: RestTimerProps): JSX.Element | null {
  if (!active) return null
  // Remount when duration changes so countdown state resets without an effect.
  return (
    <RestTimerInner
      key={seconds}
      seconds={seconds}
      onDone={onDone}
      onSkip={onSkip}
      onAdjust={onAdjust}
    />
  )
}
