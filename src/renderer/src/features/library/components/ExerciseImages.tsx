import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { exercisesRepo } from '@/db'
import { cn } from '@/lib/utils'

interface ExerciseImagesProps {
  images: string[]
  alt: string
  className?: string
  animated?: boolean
}

export function ExerciseImages({
  images,
  alt,
  className,
  animated = true
}: ExerciseImagesProps): JSX.Element {
  const [frame, setFrame] = useState(0)
  const srcs = images.slice(0, 2).map((img) => exercisesRepo.exerciseImageUrl(img))

  useEffect(() => {
    if (!animated || srcs.length < 2) return
    const id = window.setInterval(() => setFrame((f) => (f + 1) % srcs.length), 900)
    return () => window.clearInterval(id)
  }, [animated, srcs.length])

  if (srcs.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted',
          className
        )}
      >
        No images
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-black/40',
        className
      )}
    >
      {srcs.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} — frame ${i + 1}`}
          className={cn(
            'absolute inset-0 h-full w-full object-contain transition-opacity duration-300',
            i === frame || srcs.length === 1 ? 'opacity-100' : 'opacity-0',
            srcs.length === 1 && 'static'
          )}
          loading="lazy"
        />
      ))}
      {/* sizing box when absolute images */}
      {srcs.length > 1 ? <div className="aspect-[4/3] w-full" aria-hidden /> : null}
    </div>
  )
}
