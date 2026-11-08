import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Fuse from 'fuse.js'
import { LayoutGrid, List, Plus, Search, Star } from 'lucide-react'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { exercisesRepo, prefsRepo, profileRepo } from '@/db'
import { EQUIPMENT, MUSCLES, type Equipment, type Muscle } from '@/db/types'
import { cn } from '@/lib/utils'
import { CustomExerciseDialog } from './components/CustomExerciseDialog'
import { ExerciseImages } from './components/ExerciseImages'
import { muscleLabel } from './muscleLabels'
import { Library as LibraryIcon } from 'lucide-react'

type ViewMode = 'grid' | 'list'

export function LibraryPage(): JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [muscle, setMuscle] = useState<Muscle | ''>('')
  const [equipment, setEquipment] = useState<Equipment | ''>('')
  const [level, setLevel] = useState<'' | 'beginner' | 'intermediate' | 'expert'>('')
  const [mechanic, setMechanic] = useState<'' | 'compound' | 'isolation'>('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [myEquipmentOnly, setMyEquipmentOnly] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const {
    data: exercises = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => exercisesRepo.listExercises()
  })
  const { data: favoriteIds } = useQuery({
    queryKey: ['favoriteIds'],
    queryFn: () => prefsRepo.listFavoriteIds()
  })
  const { data: activeGym } = useQuery({
    queryKey: ['activeGym'],
    queryFn: () => profileRepo.getActiveGymProfile()
  })

  const fuse = useMemo(
    () =>
      new Fuse(exercises, {
        keys: ['name', 'primaryMuscles', 'equipment'],
        threshold: 0.35,
        ignoreLocation: true
      }),
    [exercises]
  )

  const filtered = useMemo(() => {
    let rows = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : exercises

    if (muscle) {
      rows = rows.filter(
        (e) => e.primaryMuscles.includes(muscle) || e.secondaryMuscles.includes(muscle)
      )
    }
    if (equipment) rows = rows.filter((e) => e.equipment.includes(equipment))
    if (level) rows = rows.filter((e) => e.level === level)
    if (mechanic) rows = rows.filter((e) => e.mechanic === mechanic)
    if (favoritesOnly && favoriteIds) rows = rows.filter((e) => favoriteIds.has(e.id))
    if (myEquipmentOnly && activeGym) {
      const avail = new Set(activeGym.equipment)
      rows = rows.filter((e) => e.equipment.every((eq) => avail.has(eq) || eq === 'bodyweight'))
    }
    return rows
  }, [
    exercises,
    fuse,
    query,
    muscle,
    equipment,
    level,
    mechanic,
    favoritesOnly,
    favoriteIds,
    myEquipmentOnly,
    activeGym
  ])

  return (
    <div>
      <PageHeader
        title="Library"
        description="Search, filter, and open any exercise — demos, history, and prefs."
        actions={
          <Button type="button" onClick={() => setCustomOpen(true)}>
            <Plus className="h-4 w-4" />
            Custom
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <Button
            type="button"
            size="icon"
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            aria-label="Grid view"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            aria-label="List view"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <select
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value as Muscle | '')}
        >
          <option value="">All muscles</option>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {muscleLabel(m)}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as Equipment | '')}
        >
          <option value="">All equipment</option>
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {eq.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
          value={level}
          onChange={(e) => setLevel(e.target.value as typeof level)}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs"
          value={mechanic}
          onChange={(e) => setMechanic(e.target.value as typeof mechanic)}
        >
          <option value="">Compound & isolation</option>
          <option value="compound">Compound</option>
          <option value="isolation">Isolation</option>
        </select>
        <Button
          type="button"
          size="sm"
          variant={favoritesOnly ? 'default' : 'secondary'}
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Star className="h-3.5 w-3.5" />
          Favorites
        </Button>
        <Button
          type="button"
          size="sm"
          variant={myEquipmentOnly ? 'default' : 'secondary'}
          onClick={() => setMyEquipmentOnly((v) => !v)}
        >
          My equipment
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {filtered.length} exercise{filtered.length === 1 ? '' : 's'}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-surface-raised/50"
            />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={LibraryIcon}
          title="Exercise library is empty"
          description="Run npm run import:exercises to download free-exercise-db."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try clearing filters or searching a different name."
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 120).map((ex) => (
            <Link
              key={ex.id}
              to={`/library/${ex.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-surface/60 transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <ExerciseImages
                images={ex.images}
                alt={ex.name}
                className="aspect-video w-full rounded-none border-0"
                animated={false}
              />
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-sm font-medium text-foreground group-hover:text-accent">
                    {ex.name}
                  </div>
                  {favoriteIds?.has(ex.id) ? (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
                  ) : null}
                </div>
                <div className="mt-1 truncate text-xs text-muted">
                  {ex.primaryMuscles.map(muscleLabel).join(', ') || '—'} ·{' '}
                  {ex.equipment.join(', ').replaceAll('_', ' ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {filtered.slice(0, 200).map((ex, i) => (
            <Link
              key={ex.id}
              to={`/library/${ex.id}`}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-hover',
                i > 0 && 'border-t border-border'
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{ex.name}</div>
                <div className="truncate text-xs text-muted">
                  {ex.primaryMuscles.map(muscleLabel).join(', ')} · {ex.level}
                  {ex.mechanic ? ` · ${ex.mechanic}` : ''}
                </div>
              </div>
              {favoriteIds?.has(ex.id) ? (
                <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <CustomExerciseDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreated={(id) => {
          void refetch()
          navigate(`/library/${id}`)
        }}
      />
    </div>
  )
}
