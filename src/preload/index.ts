import { contextBridge, ipcRenderer } from 'electron'

/** Sandboxed preload must not require external packages — bundle only Electron APIs. */
const api = {
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url) as Promise<void>,
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  getPlatform: (): Promise<NodeJS.Platform> =>
    ipcRenderer.invoke('app:getPlatform') as Promise<NodeJS.Platform>
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}
