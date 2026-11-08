export interface ForgeApi {
  openExternal: (url: string) => Promise<void>
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
}

declare global {
  interface Window {
    api: ForgeApi
  }
}

export {}
