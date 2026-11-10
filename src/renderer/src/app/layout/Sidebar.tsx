import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Library,
  LineChart,
  Settings,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/app/store/uiStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const navItems: Array<{
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}> = [
  { to: '/', label: 'Today', icon: LayoutDashboard, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/recovery', label: 'Recovery', icon: Activity },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/programs', label: 'Programs', icon: Flame },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export function Sidebar(): JSX.Element {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 232 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur-xl"
    >
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_0_24px_rgb(198_255_61_/_0.35)]">
          <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="font-display text-xl font-bold tracking-[0.14em] text-foreground">
              FORGE
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Adaptive Strength
            </div>
          </div>
        ) : null}
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Primary">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <Tooltip key={to} delayDuration={collapsed ? 0 : 400}>
            <TooltipTrigger asChild>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                        aria-hidden
                      />
                    ) : null}
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                    {!collapsed ? <span>{label}</span> : null}
                  </>
                )}
              </NavLink>
            </TooltipTrigger>
            {collapsed ? <TooltipContent side="right">{label}</TooltipContent> : null}
          </Tooltip>
        ))}
      </nav>

      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-2 text-muted',
            collapsed && 'justify-center px-0'
          )}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span>Collapse</span> : null}
        </Button>
      </div>
    </motion.aside>
  )
}
