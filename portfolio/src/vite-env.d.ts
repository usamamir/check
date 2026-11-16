/// <reference types="vite/client" />

export {}

declare global {
  interface DigivistacoThemeConfig {
    themeUrl?: string
    photo?: string
    photoThumb?: string
  }

  interface Window {
    DigivistacoTheme?: DigivistacoThemeConfig
  }
}
