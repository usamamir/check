import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        io.unobserve(el)
      }
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px', ...options })
    io.observe(el)
    return () => io.disconnect()
  }, [options])

  return { ref, inView }
}
