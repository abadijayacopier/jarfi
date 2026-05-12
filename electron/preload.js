const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkStatus: () => ipcRenderer.invoke('check-status'),
  startAllServices: () => ipcRenderer.invoke('start-all-services'),
  saveSettings: (url) => ipcRenderer.send('save-settings', url),
  closeSettings: () => ipcRenderer.send('close-settings'),
  restartApp: () => ipcRenderer.send('restart_app'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (_, msg) => callback(msg)),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_, progress) => callback(progress)),
});
