export function useLocalJson<T>(key: string, fallback: T): [T, (v: T) => void] {
  // Tiny helper for non-hook contexts; pages use direct localStorage via auth/workouts.
  const raw = localStorage.getItem(key)
  if (!raw) return [fallback, (v) => localStorage.setItem(key, JSON.stringify(v))]
  try {
    return [JSON.parse(raw) as T, (v) => localStorage.setItem(key, JSON.stringify(v))]
  } catch {
    return [fallback, (v) => localStorage.setItem(key, JSON.stringify(v))]
  }
}
