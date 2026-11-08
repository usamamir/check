import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exercisesRepo, prefsRepo } from '@/db'
import { EQUIPMENT, MUSCLES, type Equipment, type Muscle } from '@/db/types'
import { parseYouTubeVideoId } from '@/lib/youtube'
import { muscleLabel } from '../muscleLabels'

interface CustomExerciseDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

export function CustomExerciseDialog({
  open,
  onClose,
  onCreated
}: CustomExerciseDialogProps): JSX.Element | null {
  const [name, setName] = useState('')
  const [primary, setPrimary] = useState<Muscle>('chest')
  const [equipment, setEquipment] = useState<Equipment>('dumbbell')
  const [video, setVideo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const submit = async (): Promise<void> => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    const videoId = video.trim() ? parseYouTubeVideoId(video) : null
    if (video.trim() && !videoId) {
      setError('Invalid YouTube link')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const id = `custom_${crypto.randomUUID()}`
      await exercisesRepo.upsertCustomExercise({
        id,
        name: name.trim(),
        primaryMuscles: [primary],
        secondaryMuscles: [],
        equipment: [equipment],
        mechanic: null,
        force: null,
        level: 'beginner',
        category: 'strength',
        instructions: [],
        images: []
      })
      if (videoId) {
        await prefsRepo.updateExercisePref(id, { customVideoId: videoId })
      }
      onCreated(id)
      onClose()
      setName('')
      setVideo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <h3 className="font-display text-2xl font-bold tracking-wide">Custom exercise</h3>
        <p className="mt-1 text-sm text-muted">Saved locally on this device.</p>

        <div className="mt-5 space-y-3">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            Name
            <input
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            Primary muscle
            <select
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={primary}
              onChange={(e) => setPrimary(e.target.value as Muscle)}
            >
              {MUSCLES.map((m) => (
                <option key={m} value={m}>
                  {muscleLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            Equipment
            <select
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as Equipment)}
            >
              {EQUIPMENT.map((eq) => (
                <option key={eq} value={eq}>
                  {eq.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">
            YouTube link (optional)
            <input
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
            />
          </label>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
