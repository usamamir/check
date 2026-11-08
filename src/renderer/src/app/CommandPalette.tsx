import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useTodayStore } from '@/features/workout/store/todayStore'

const PAGES = [
  { label: 'Today', to: '/' },
  { label: 'Workout', to: '/workout' },
  { label: 'Recovery', to: '/recovery' },
  { label: 'Library', to: '/library' },
  { label: 'History', to: '/history' },
  { label: 'Progress', to: '/progress' },
  { label: 'Programs', to: '/programs' },
  { label: 'Settings', to: '/settings' }
]

export function CommandPalette(): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const generate = useTodayStore((s) => s.generate)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[15vh]">
      <Command
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        label="Command palette"
      >
        <Command.Input
          placeholder="Search pages and actions…"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            No results.
          </Command.Empty>
          <Command.Group
            heading="Navigate"
            className="text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {PAGES.map((p) => (
              <Command.Item
                key={p.to}
                value={p.label}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-accent-soft aria-selected:text-accent"
                onSelect={() => {
                  navigate(p.to)
                  setOpen(false)
                }}
              >
                {p.label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group
            heading="Actions"
            className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            <Command.Item
              value="Start workout generate"
              className="cursor-pointer rounded-lg px-3 py-2 text-sm aria-selected:bg-accent-soft aria-selected:text-accent"
              onSelect={() => {
                void generate()
                navigate('/')
                setOpen(false)
              }}
            >
              Generate today’s workout
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="Close"
        onClick={() => setOpen(false)}
      />
    </div>
  )
}
