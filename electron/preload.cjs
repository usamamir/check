const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('monarchDesktop', {
  isDesktop: true,
});
