import type { JSX } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { db, profileRepo } from '@/db'
import type { Program } from '@/db/types'
import fullBody from '@/data/programs/full-body-beginner.json'
import upperLower from '@/data/programs/upper-lower.json'
import ppl from '@/data/programs/ppl.json'
import fiveThreeOne from '@/data/programs/five-three-one.json'

const BUILTINS = [fullBody, upperLower, ppl, fiveThreeOne] as Program[]

export function ProgramsPage(): JSX.Element {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => profileRepo.getAppSettings()
  })

  const seed = async (): Promise<void> => {
    await db.programs.bulkPut(BUILTINS)
    await queryClient.invalidateQueries({ queryKey: ['programs'] })
  }

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const rows = await db.programs.toArray()
      if (rows.length === 0) {
        await db.programs.bulkPut(BUILTINS)
        return BUILTINS
      }
      return rows
    }
  })

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Adaptive mode (default) or follow a built-in template. Weights still use the progression engine."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={settings?.trainingMode === 'adaptive' ? 'default' : 'secondary'}
              onClick={async () => {
                await profileRepo.updateAppSettings({ trainingMode: 'adaptive' })
                await queryClient.invalidateQueries({ queryKey: ['appSettings'] })
              }}
            >
              Adaptive
            </Button>
            <Button
              type="button"
              size="sm"
              variant={settings?.trainingMode === 'program' ? 'default' : 'secondary'}
              onClick={async () => {
                await profileRepo.updateAppSettings({ trainingMode: 'program' })
                await queryClient.invalidateQueries({ queryKey: ['appSettings'] })
              }}
            >
              Follow program
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {programs.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-surface/60 p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.daysPerWeek} days · {p.level}
            </div>
            <h3 className="mt-1 font-display text-xl font-bold tracking-wide">{p.name}</h3>
            <p className="mt-2 text-sm text-muted">{p.description}</p>
            <Button
              type="button"
              className="mt-4"
              size="sm"
              variant={settings?.activeProgramId === p.id ? 'default' : 'secondary'}
              onClick={async () => {
                await profileRepo.updateAppSettings({
                  trainingMode: 'program',
                  activeProgramId: p.id
                })
                await queryClient.invalidateQueries({ queryKey: ['appSettings'] })
              }}
            >
              {settings?.activeProgramId === p.id ? 'Active' : 'Use program'}
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="ghost" size="sm" className="mt-4" onClick={() => void seed()}>
        Reseed built-in programs
      </Button>
    </div>
  )
}
