import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  accent: string
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setAccent: (accent: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      accent: '#C6FF3D',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setAccent: (accent) => set({ accent })
    }),
    { name: 'forge-ui' }
  )
)
