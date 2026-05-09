const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settingsWindow;

const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return null;
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config));
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
}

function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(url);

  // Check for updates after window is ready
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  // Update events
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });

  // Custom Menu to Reset IP
  const menu = Menu.buildFromTemplate([
    {
      label: 'Aplikasi',
      submenu: [
        { label: 'Refresh', role: 'reload' },
        { type: 'separator' },
        {
          label: 'Ganti Server IP',
          click: () => {
            if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
            app.relaunch();
            app.exit();
          }
        },
        { label: 'Keluar', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  const config = loadConfig();
  if (config && config.serverUrl) {
    createMainWindow(config.serverUrl);
  } else {
    createSettingsWindow();
  }
});

ipcMain.on('save-settings', (event, url) => {
  // Ensure URL is valid and has http/https
  let finalUrl = url.trim();
  if (!finalUrl.startsWith('http')) {
    finalUrl = 'http://' + finalUrl;
  }
  
  saveConfig({ serverUrl: finalUrl });
  
  if (settingsWindow) settingsWindow.close();
  createMainWindow(finalUrl);
});

ipcMain.on('close-settings', () => {
  app.quit();
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
