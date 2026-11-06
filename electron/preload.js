const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('streakly', {
  getAll: () => ipcRenderer.invoke('store:getAll'),
  saveAll: (data) => ipcRenderer.invoke('store:saveAll', data),
  get: (key) => ipcRenderer.invoke('store:get', key),
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  notify: (payload) => ipcRenderer.invoke('notify', payload),
  platform: () => ipcRenderer.invoke('app:platform'),
  onCheckReminders: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('check-reminders', handler);
    return () => ipcRenderer.removeListener('check-reminders', handler);
  },
});
