import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { TodayPage } from '@/features/workout/TodayPage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { RecoveryPage } from '@/features/recovery/RecoveryPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { ProgramsPage } from '@/features/programs/ProgramsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'workout', element: <WorkoutPage /> },
      { path: 'recovery', element: <RecoveryPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'programs', element: <ProgramsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
])
