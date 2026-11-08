import type { JSX } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { CommandPalette } from '@/app/CommandPalette'

export default function App(): JSX.Element {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <CommandPalette />
    </AppProviders>
  )
}
