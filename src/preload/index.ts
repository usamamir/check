import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url) as Promise<void>,
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  getPlatform: (): Promise<NodeJS.Platform> =>
    ipcRenderer.invoke('app:getPlatform') as Promise<NodeJS.Platform>
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error fallback when isolation is off
  window.electron = electronAPI
  // @ts-expect-error fallback when isolation is off
  window.api = api
}
