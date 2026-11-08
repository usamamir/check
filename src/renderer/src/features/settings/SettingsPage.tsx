import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/app/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { profileRepo } from '@/db'
import { Check, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsPage(): JSX.Element {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => profileRepo.getUserProfile()
  })

  const settingsQuery = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => profileRepo.getAppSettings()
  })

  const gymsQuery = useQuery({
    queryKey: ['gymProfiles'],
    queryFn: () => profileRepo.listGymProfiles()
  })

  const activateGym = useMutation({
    mutationFn: (id: string) => profileRepo.setActiveGymProfile(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gymProfiles'] })
    }
  })

  const profile = profileQuery.data
  const settings = settingsQuery.data
  const gyms = gymsQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Units, gym profiles, schedule, theme, sounds, and data controls."
      />

      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-surface/70 p-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]">
          <h2 className="font-display text-xl font-bold tracking-wide">Profile</h2>
          <p className="mt-1 text-sm text-muted">
            Editable fully after onboarding (Phase 3). Defaults are seeded locally.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Meta label="Goal" value={profile?.goal ?? '—'} />
            <Meta label="Experience" value={profile?.experience ?? '—'} />
            <Meta label="Days / week" value={profile ? String(profile.daysPerWeek) : '—'} />
            <Meta label="Session length" value={profile ? `${profile.sessionMinutes} min` : '—'} />
            <Meta label="Split" value={profile?.splitPref ?? '—'} />
            <Meta label="Units" value={profile?.units ?? '—'} />
            <Meta
              label="Onboarding"
              value={profile?.onboardingComplete ? 'Complete' : 'Not finished'}
            />
            <Meta label="Theme" value={settings?.theme ?? '—'} />
            <Meta label="Accent" value={settings?.accent ?? '—'} />
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await profileRepo.updateUserProfile({ onboardingComplete: false })
                await queryClient.invalidateQueries({ queryKey: ['userProfile'] })
                navigate('/onboarding')
              }}
            >
              Redo onboarding
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/70 p-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised">
              <Dumbbell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide">Gym profiles</h2>
              <p className="text-sm text-muted">
                Equipment and plate settings used by the adaptive engine.
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-3 md:grid-cols-2">
            {gyms.map((gym) => (
              <button
                key={gym.id}
                type="button"
                onClick={() => activateGym.mutate(gym.id)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors duration-150',
                  gym.isActive
                    ? 'border-accent/40 bg-accent-soft'
                    : 'border-border bg-surface-raised/60 hover:border-border-strong hover:bg-surface-hover'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">{gym.name}</div>
                    <div className="mt-1 text-xs text-muted">
                      {gym.equipment.length} equipment · bar {gym.barWeight}
                      {profile?.units === 'imperial' ? 'lb' : 'kg'}
                    </div>
                  </div>
                  {gym.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Tap to activate
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/70 p-6">
          <h2 className="font-display text-xl font-bold tracking-wide">Data</h2>
          <p className="mt-1 text-sm text-muted">
            Export / import / backup arrive in Phase 12. All data stays on this machine.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled>
              Export JSON
            </Button>
            <Button variant="secondary" disabled>
              Import JSON
            </Button>
            <Button variant="ghost" disabled>
              Reset all data
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/50 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold tabular tracking-wide text-foreground">
        {value}
      </div>
    </div>
  )
}
