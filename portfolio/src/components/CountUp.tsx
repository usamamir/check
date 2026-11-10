import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'

type Props = {
  value: number
  suffix?: string
  duration?: number
}

export function CountUp({ value, suffix = '', duration = 1400 }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  )
}
