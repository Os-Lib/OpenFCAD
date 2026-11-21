const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  onMaximizedChange: (cb) => ipcRenderer.on('window-maximized', (_e, val) => cb(val)),
  openFile: (filters) => ipcRenderer.invoke('dialog-open-file', filters),
  saveFile: (opts) => ipcRenderer.invoke('dialog-save-file', opts),
  getInitialLaunchInfo: () => ipcRenderer.invoke('get-initial-launch-info'),
  onOpenExternalFile: (cb) => ipcRenderer.on('open-external-file', (_e, file) => cb(file)),
});
