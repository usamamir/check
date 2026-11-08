import type { JSX, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GYM_PRESETS } from '@/db/defaults'
import { OptionCard } from './components/OptionCard'
import { StepShell } from './components/StepShell'
import {
  defaultOnboardingValues,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  ONBOARDING_STEPS,
  SPLIT_OPTIONS,
  type OnboardingValues
} from './onboardingSchema'
import { saveOnboarding } from './saveOnboarding'

const SESSION_LENGTHS = [30, 45, 60, 75, 90] as const

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<OnboardingValues>(defaultOnboardingValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  const weightUnit = values.units === 'metric' ? 'kg' : 'lb'
  const heightUnit = values.units === 'metric' ? 'cm' : 'in'

  const patch = (partial: Partial<OnboardingValues>): void => {
    setValues((v) => ({ ...v, ...partial }))
  }

  const canContinue = useMemo(() => {
    if (current.id === 'goal') return Boolean(values.goal)
    if (current.id === 'experience') return Boolean(values.experience)
    if (current.id === 'schedule') return values.daysPerWeek >= 2 && values.sessionMinutes > 0
    if (current.id === 'split') return Boolean(values.splitPref)
    if (current.id === 'equipment') return Boolean(values.gymPreset)
    return true
  }, [current.id, values])

  const finish = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      await saveOnboarding(values)
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      await queryClient.invalidateQueries({ queryKey: ['gymProfiles'] })
      await queryClient.invalidateQueries({ queryKey: ['appSettings'] })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding')
      setSaving(false)
    }
  }

  const next = (): void => {
    if (isLast) {
      void finish()
      return
    }
    setStep((s) => Math.min(s + 1, ONBOARDING_STEPS.length - 1))
  }

  const back = (): void => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_0_24px_rgb(198_255_61_/_0.35)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-[0.14em]">FORGE</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Setup · ~60 seconds
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5" aria-label="Progress">
          {ONBOARDING_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.title}
              onClick={() => setStep(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                i === step
                  ? 'w-6 bg-accent'
                  : i < step
                    ? 'w-2 bg-accent/50'
                    : 'w-2 bg-border-strong'
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <div key={current.id}>
            {current.id === 'goal' ? (
              <StepShell title={current.title} description={current.description}>
                <div className="grid gap-3">
                  {GOAL_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      selected={values.goal === opt.value}
                      onSelect={() => patch({ goal: opt.value })}
                      title={opt.label}
                      description={opt.blurb}
                    />
                  ))}
                </div>
              </StepShell>
            ) : null}

            {current.id === 'experience' ? (
              <StepShell title={current.title} description={current.description}>
                <div className="grid gap-3">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      selected={values.experience === opt.value}
                      onSelect={() => patch({ experience: opt.value })}
                      title={opt.label}
                      description={opt.blurb}
                    />
                  ))}
                </div>
              </StepShell>
            ) : null}

            {current.id === 'body' ? (
              <StepShell title={current.title} description={current.description}>
                <div className="mb-4 flex gap-2">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <Button
                      key={u}
                      type="button"
                      size="sm"
                      variant={values.units === u ? 'default' : 'secondary'}
                      onClick={() => patch({ units: u })}
                    >
                      {u === 'metric' ? 'kg / cm' : 'lb / in'}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Sex">
                    <select
                      className="field"
                      value={values.sex}
                      onChange={(e) => patch({ sex: e.target.value as OnboardingValues['sex'] })}
                    >
                      <option value="unspecified">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Age">
                    <input
                      className="field tabular"
                      type="number"
                      min={13}
                      max={100}
                      placeholder="Optional"
                      value={values.age ?? ''}
                      onChange={(e) =>
                        patch({ age: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                  <Field label={`Bodyweight (${weightUnit})`}>
                    <input
                      className="field tabular"
                      type="number"
                      min={1}
                      step={0.1}
                      placeholder="Optional"
                      value={values.bodyweight ?? ''}
                      onChange={(e) =>
                        patch({ bodyweight: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                  <Field label={`Height (${heightUnit})`}>
                    <input
                      className="field tabular"
                      type="number"
                      min={1}
                      step={0.1}
                      placeholder="Optional"
                      value={values.height ?? ''}
                      onChange={(e) =>
                        patch({ height: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">You can skip any of these.</p>
              </StepShell>
            ) : null}

            {current.id === 'schedule' ? (
              <StepShell title={current.title} description={current.description}>
                <Field label={`Days per week · ${values.daysPerWeek}`}>
                  <input
                    className="w-full accent-accent"
                    type="range"
                    min={2}
                    max={6}
                    value={values.daysPerWeek}
                    onChange={(e) => patch({ daysPerWeek: Number(e.target.value) })}
                  />
                  <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>2</span>
                    <span>6</span>
                  </div>
                </Field>
                <div className="mt-6">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Session length
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SESSION_LENGTHS.map((mins) => (
                      <Button
                        key={mins}
                        type="button"
                        variant={values.sessionMinutes === mins ? 'default' : 'secondary'}
                        onClick={() => patch({ sessionMinutes: mins })}
                      >
                        {mins} min
                      </Button>
                    ))}
                  </div>
                </div>
              </StepShell>
            ) : null}

            {current.id === 'split' ? (
              <StepShell title={current.title} description={current.description}>
                <div className="grid gap-3">
                  {SPLIT_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      selected={values.splitPref === opt.value}
                      onSelect={() => patch({ splitPref: opt.value })}
                      title={opt.label}
                      description={opt.blurb}
                      badge={opt.recommended ? 'Recommended' : undefined}
                    />
                  ))}
                </div>
              </StepShell>
            ) : null}

            {current.id === 'equipment' ? (
              <StepShell title={current.title} description={current.description}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GYM_PRESETS.map((preset) => (
                    <OptionCard
                      key={preset.name}
                      selected={values.gymPreset === preset.name}
                      onSelect={() =>
                        patch({
                          gymPreset: preset.name as OnboardingValues['gymPreset'],
                          dumbbellMax: preset.dumbbellMax
                        })
                      }
                      title={preset.name}
                      description={`${preset.equipment.length} equipment types`}
                    />
                  ))}
                </div>
                {values.gymPreset !== 'Bodyweight Only' ? (
                  <div className="mt-6">
                    <Field label={`Dumbbell max (${weightUnit})`}>
                      <input
                        className="field tabular"
                        type="number"
                        min={1}
                        value={values.dumbbellMax ?? ''}
                        onChange={(e) =>
                          patch({
                            dumbbellMax: e.target.value ? Number(e.target.value) : null
                          })
                        }
                      />
                    </Field>
                  </div>
                ) : null}
              </StepShell>
            ) : null}

            {current.id === 'baseline' ? (
              <StepShell title={current.title} description={current.description}>
                <p className="mb-4 text-sm text-muted">
                  Do you know roughly what you lift? Skip if not — FORGE calibrates over the first
                  few sessions.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ['bench', 'Bench press'],
                      ['squat', 'Squat'],
                      ['deadlift', 'Deadlift'],
                      ['ohp', 'Overhead press']
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-border bg-surface-raised/40 p-3"
                    >
                      <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {label}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="field tabular"
                          type="number"
                          min={1}
                          placeholder={weightUnit}
                          value={values.baseline[key]?.weight ?? ''}
                          onChange={(e) => {
                            const weight = e.target.value ? Number(e.target.value) : null
                            patch({
                              baseline: {
                                ...values.baseline,
                                [key]:
                                  weight && values.baseline[key]?.reps
                                    ? { weight, reps: values.baseline[key]!.reps }
                                    : weight
                                      ? { weight, reps: 5 }
                                      : null
                              }
                            })
                          }}
                        />
                        <input
                          className="field tabular w-24"
                          type="number"
                          min={1}
                          max={20}
                          placeholder="reps"
                          value={values.baseline[key]?.reps ?? ''}
                          onChange={(e) => {
                            const reps = e.target.value ? Number(e.target.value) : null
                            const weight = values.baseline[key]?.weight
                            patch({
                              baseline: {
                                ...values.baseline,
                                [key]: weight && reps ? { weight, reps } : null
                              }
                            })
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </StepShell>
            ) : null}
          </div>
        </AnimatePresence>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || saving}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {current.id === 'body' || current.id === 'baseline' ? (
            <Button type="button" variant="secondary" onClick={next} disabled={saving}>
              Skip
            </Button>
          ) : null}
          <Button type="button" onClick={next} disabled={!canContinue || saving}>
            {saving ? 'Saving…' : isLast ? 'Start forging' : 'Continue'}
          </Button>
        </div>
      </div>

      <style>{`
        .field {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(255 255 255 / 0.08);
          background: #121214;
          color: #f4f4f5;
          padding: 0 0.75rem;
        }
        .field:focus {
          outline: 2px solid #c6ff3d;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}
