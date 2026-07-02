const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  checkAccess:   (email) => ipcRenderer.invoke('check-access', email),
  loadProducts:  () => ipcRenderer.invoke('load-products'),
  loadSettings:  () => ipcRenderer.invoke('load-settings'),
  loadNav:       () => ipcRenderer.invoke('load-nav'),
  loadMessages:  (board) => ipcRenderer.invoke('load-messages', board),
  postMessage:   (board, name, email, message) => ipcRenderer.invoke('post-message', board, name, email, message),
  deleteMessage: (msgId) => ipcRenderer.invoke('delete-message', msgId),
  openExternal:  (url) => ipcRenderer.invoke('open-external', url)
});
