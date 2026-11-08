/**
 * Round a target load to the nearest achievable weight given bar + plates (per side)
 * or dumbbell increments.
 */
export function roundToPlateLoad(
  target: number,
  barWeight: number,
  plates: number[],
  mode: 'nearest' | 'down' | 'up' = 'nearest'
): number {
  if (target <= barWeight) return barWeight
  const sorted = [...plates].filter((p) => p > 0).sort((a, b) => b - a)
  if (sorted.length === 0) return Math.round(target)

  const candidates = new Set<number>([barWeight])
  const maxPerSide = sorted[0] * 8
  const sideTargets: number[] = []

  // Generate realistic per-side loads via greedy combinations up to a cap
  const dfs = (remaining: number[], load: number): void => {
    if (load > maxPerSide) return
    sideTargets.push(load)
    for (let i = 0; i < remaining.length; i++) {
      dfs(remaining.slice(i), load + remaining[i])
    }
  }
  dfs(sorted, 0)

  for (const side of sideTargets) {
    candidates.add(barWeight + side * 2)
  }

  const list = [...candidates].sort((a, b) => a - b)
  if (mode === 'down') {
    const down = [...list].reverse().find((v) => v <= target)
    return down ?? barWeight
  }
  if (mode === 'up') {
    return list.find((v) => v >= target) ?? list[list.length - 1]
  }

  let best = list[0]
  let bestDist = Math.abs(best - target)
  for (const v of list) {
    const d = Math.abs(v - target)
    if (d < bestDist) {
      best = v
      bestDist = d
    }
  }
  return best
}

export function roundToIncrement(
  target: number,
  increment: number,
  mode: 'nearest' | 'down' | 'up' = 'nearest'
): number {
  if (increment <= 0) return target
  const scaled = target / increment
  if (mode === 'down') return Math.floor(scaled) * increment
  if (mode === 'up') return Math.ceil(scaled) * increment
  return Math.round(scaled) * increment
}

export function platesPerSide(
  totalWeight: number,
  barWeight: number,
  availablePlates: number[]
): number[] {
  let remaining = (totalWeight - barWeight) / 2
  if (remaining <= 0) return []
  const sorted = [...availablePlates].filter((p) => p > 0).sort((a, b) => b - a)
  const used: number[] = []
  for (const plate of sorted) {
    while (remaining + 1e-9 >= plate) {
      used.push(plate)
      remaining -= plate
    }
  }
  return used
}
