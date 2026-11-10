import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'

type Props = {
  children: ReactNode
  className?: string
  intensity?: number
}

export function Tilt3D({ children, className = '', intensity = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 220,
    damping: 22,
  })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 220,
    damping: 22,
  })
  const glareX = useTransform(mx, [-0.5, 0.5], ['15%', '85%'])
  const glareY = useTransform(my, [-0.5, 0.5], ['15%', '85%'])
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(255,255,255,0.2), transparent 55%)`

  const onMove = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`m26-tilt ${className}`}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: 'preserve-3d',
      }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="m26-tilt__inner">{children}</div>
      <motion.div className="m26-tilt__glare" style={{ background: glare }} aria-hidden />
    </motion.div>
  )
}
