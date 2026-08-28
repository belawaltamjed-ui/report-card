const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadState: () => ipcRenderer.invoke('db:load'),
  saveState: (state) => ipcRenderer.invoke('db:save', state),
  getDbPath: () => ipcRenderer.invoke('db:getPath')
});
