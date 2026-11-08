import type { JSX } from 'react'
import { platesPerSide } from '@/lib/plates'
import { Button } from '@/components/ui/button'

interface PlateCalculatorProps {
  totalWeight: number
  barWeight: number
  plates: number[]
  onClose: () => void
}

export function PlateCalculator({
  totalWeight,
  barWeight,
  plates,
  onClose
}: PlateCalculatorProps): JSX.Element {
  const perSide = platesPerSide(totalWeight, barWeight, plates)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <h3 className="font-display text-2xl font-bold">Plate calculator</h3>
        <p className="mt-1 text-sm text-muted">
          <span className="font-display text-xl tabular text-accent">{totalWeight}</span> total ·
          bar {barWeight}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {perSide.length === 0 ? (
            <span className="text-sm text-muted">Empty bar</span>
          ) : (
            perSide.map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 font-display text-lg font-semibold tabular text-accent"
              >
                {p}
              </span>
            ))
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Each side (mirrored).</p>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
