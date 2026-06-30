const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  checkAccess: (email) => ipcRenderer.invoke('check-access', email),
  loadProducts: () => ipcRenderer.invoke('load-products'),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  loadNav: () => ipcRenderer.invoke('load-nav')
});
