import { useEffect } from 'react'
import type { Exercise } from '../data/exercises'
import { muscleLabels } from '../data/exercises'

export function VideoModal({
  exercise,
  onClose,
}: {
  exercise: Exercise | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!exercise) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exercise, onClose])

  if (!exercise) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3>{exercise.name}</h3>
            <p>
              {exercise.muscles.map((m) => muscleLabels[m]).join(' · ')} · {exercise.level}
            </p>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="video-embed">
          <iframe
            title={`${exercise.name} demo`}
            src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeId}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <ul className="cue-list">
          {exercise.cues.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
