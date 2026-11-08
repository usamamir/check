import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { ExternalLink, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prefsRepo } from '@/db'
import {
  parseYouTubeVideoId,
  youtubeEmbedUrl,
  youtubeSearchUrl,
  type VideoMap
} from '@/lib/youtube'
import { ExerciseImages } from './ExerciseImages'
import videoMapJson from '@/data/videoMap.json'

const videoMap = videoMapJson as VideoMap

interface ExerciseMediaProps {
  exerciseId: string
  exerciseName: string
  images: string[]
}

export function ExerciseMedia({
  exerciseId,
  exerciseName,
  images
}: ExerciseMediaProps): JSX.Element {
  const [customVideoId, setCustomVideoId] = useState<string | null>(null)
  const [paste, setPaste] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [offline, setOffline] = useState(!navigator.onLine)
  const [embedFailed, setEmbedFailed] = useState(false)

  useEffect(() => {
    void prefsRepo.getExercisePref(exerciseId).then((p) => setCustomVideoId(p.customVideoId))
  }, [exerciseId])

  useEffect(() => {
    const on = (): void => setOffline(false)
    const off = (): void => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const mapped = videoMap[exerciseId]
  const videoId = customVideoId ?? mapped?.videoId ?? null

  const openSearch = async (): Promise<void> => {
    await window.api.openExternal(youtubeSearchUrl(exerciseName))
  }

  const savePaste = async (): Promise<void> => {
    const id = parseYouTubeVideoId(paste)
    if (!id) {
      setPasteError('Paste a valid YouTube link (watch, youtu.be, shorts, or embed).')
      return
    }
    setPasteError(null)
    await prefsRepo.updateExercisePref(exerciseId, { customVideoId: id })
    setCustomVideoId(id)
    setPaste('')
    setEmbedFailed(false)
  }

  if (offline || embedFailed || !videoId) {
    return (
      <div className="space-y-3">
        <ExerciseImages images={images} alt={exerciseName} className="aspect-video w-full" />
        <div className="rounded-xl border border-border bg-surface-raised/60 p-4">
          {offline ? (
            <div className="mb-3 flex items-center gap-2 text-sm text-warning">
              <WifiOff className="h-4 w-4" />
              Video unavailable offline — showing images
            </div>
          ) : !videoId ? (
            <p className="mb-3 text-sm text-muted">
              No curated demo yet. Use images, find a video, or paste your own link.
            </p>
          ) : (
            <p className="mb-3 text-sm text-muted">Embed failed — falling back to images.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void openSearch()}>
              <ExternalLink className="h-3.5 w-3.5" />
              Find on YouTube
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              placeholder="Paste YouTube link…"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <Button type="button" size="sm" onClick={() => void savePaste()}>
              Save
            </Button>
          </div>
          {pasteError ? <p className="mt-2 text-xs text-danger">{pasteError}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          title={`${exerciseName} demo`}
          src={youtubeEmbedUrl(videoId, { start: mapped?.start, end: mapped?.end })}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setEmbedFailed(true)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => void openSearch()}>
          <ExternalLink className="h-3.5 w-3.5" />
          Find another
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setEmbedFailed(true)
          }}
        >
          Use images
        </Button>
      </div>
    </div>
  )
}
