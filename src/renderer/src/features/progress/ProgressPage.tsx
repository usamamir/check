import type { JSX, ReactNode } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { format, parseISO, subWeeks } from 'date-fns'
import { PageHeader } from '@/app/layout/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { db, profileRepo } from '@/db'
import { LineChart as LineChartIcon } from 'lucide-react'

type Range = '4W' | '12W' | '6M' | '1Y' | 'All'

function rangeStart(range: Range): Date | null {
  const now = new Date()
  if (range === '4W') return subWeeks(now, 4)
  if (range === '12W') return subWeeks(now, 12)
  if (range === '6M') return subWeeks(now, 26)
  if (range === '1Y') return subWeeks(now, 52)
  return null
}

export function ProgressPage(): JSX.Element {
  const [range, setRange] = useState<Range>('12W')

  const { data, isLoading } = useQuery({
    queryKey: ['progress', range],
    queryFn: async () => {
      const start = rangeStart(range)
      const profile = await profileRepo.getUserProfile()
      let workouts = await db.workouts.where('status').equals('completed').toArray()
      if (start) {
        workouts = workouts.filter((w) => w.endedAt && parseISO(w.endedAt) >= start)
      }
      workouts.sort((a, b) => (a.endedAt ?? '').localeCompare(b.endedAt ?? ''))

      const prs = await db.personalRecords.orderBy('achievedAt').toArray()
      const prTimeline = prs
        .filter((p) => !start || parseISO(p.achievedAt) >= start)
        .map((p) => ({
          date: format(parseISO(p.achievedAt), 'MMM d'),
          value: Math.round(p.value),
          type: p.type
        }))

      const volumeByWeek: Record<string, number> = {}
      for (const w of workouts) {
        const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
        let vol = 0
        for (const we of wes) {
          const sets = await db.sets.where('workoutExerciseId').equals(we.id).toArray()
          for (const s of sets) {
            if (s.completedAt && s.weight && s.reps) vol += s.weight * s.reps
          }
        }
        const key = w.endedAt ? format(parseISO(w.endedAt), 'yyyy-ww') : '—'
        volumeByWeek[key] = (volumeByWeek[key] ?? 0) + vol
      }

      const volumeSeries = Object.entries(volumeByWeek).map(([week, volume]) => ({
        week,
        volume: Math.round(volume)
      }))

      const oneRmPrs = prs.filter((p) => p.type === 'estimated_1rm')
      const best1 = oneRmPrs.reduce((m, p) => Math.max(m, p.value), 0)
      const bw = profile.bodyweight ?? 80
      const strengthScore = best1 > 0 ? Math.round((best1 / bw) * 100) : 0

      return {
        workoutCount: workouts.length,
        streakWeeks: Math.min(workouts.length, 12),
        strengthScore,
        prTimeline,
        volumeSeries,
        sampleOneRm: oneRmPrs.slice(-12).map((p) => ({
          date: format(parseISO(p.achievedAt), 'MMM d'),
          oneRm: Math.round(p.value)
        }))
      }
    }
  })

  const empty = !isLoading && (!data || data.workoutCount === 0)

  return (
    <div>
      <PageHeader
        title="Progress"
        description="Strength score, volume, frequency, and PR timeline."
        actions={
          <div className="flex gap-1">
            {(['4W', '12W', '6M', '1Y', 'All'] as Range[]).map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={range === r ? 'default' : 'secondary'}
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface/50" />
      ) : empty ? (
        <EmptyState
          icon={LineChartIcon}
          title="Not enough data yet"
          description="Complete a few sessions or use Settings → Seed demo history."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Strength score" value={String(data!.strengthScore)} />
            <Metric label="Workouts" value={String(data!.workoutCount)} />
            <Metric label="Weekly streak" value={String(data!.streakWeeks)} />
          </div>

          <ChartCard title="Weekly volume">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data!.volumeSeries}>
                <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1D',
                    border: '1px solid rgb(255 255 255 / 0.08)'
                  }}
                />
                <Bar dataKey="volume" fill="#C6FF3D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estimated 1RM trend">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={data!.sampleOneRm.length ? data!.sampleOneRm : [{ date: '—', oneRm: 0 }]}
              >
                <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1D',
                    border: '1px solid rgb(255 255 255 / 0.08)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="oneRm"
                  stroke="#C6FF3D"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="PR timeline">
            <ul className="space-y-2 text-sm">
              {data!.prTimeline.length === 0 ? (
                <li className="text-muted">No PRs in this range.</li>
              ) : (
                data!.prTimeline
                  .slice(-10)
                  .reverse()
                  .map((p, i) => (
                    <li key={`${p.date}-${i}`} className="flex justify-between text-muted">
                      <span>{p.date}</span>
                      <span className="text-foreground">
                        {p.type.replaceAll('_', ' ')} ·{' '}
                        <span className="font-display tabular text-accent">{p.value}</span>
                      </span>
                    </li>
                  ))
              )}
            </ul>
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold tabular text-foreground">{value}</div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-4">
      <h3 className="mb-3 font-display text-lg font-bold tracking-wide">{title}</h3>
      {children}
    </section>
  )
}
