const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');

let mainWindow;
let settingsWindow;
let serverProcess;
let mariadbProcess;

const configPath = path.join(app.getPath('userData'), 'config.json');
const logPath = path.join(app.getPath('userData'), 'jarfi.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(msg);
  try { fs.appendFileSync(logPath, line); } catch {}
  // Kirim ke renderer jika window ada
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('log-message', msg);
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveConfig(config) {
  const existing = loadConfig() || {};
  fs.writeFileSync(configPath, JSON.stringify({ ...existing, ...config }));
}

// ═══════════════════════════════════════
//  TIMEOUT HELPER
// ═══════════════════════════════════════
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

// ═══════════════════════════════════════
//  MARIADB MANAGEMENT
// ═══════════════════════════════════════

function getMariaDBPaths() {
  if (app.isPackaged) {
    const base = path.join(process.resourcesPath, 'mariadb');
    return {
      mysqld: path.join(base, 'bin', 'mysqld.exe'),
      mysql: path.join(base, 'bin', 'mysql.exe'),
      dataDir: path.join(base, 'data'),
      baseDir: base
    };
  }
  return { mysqld: 'mysqld', mysql: 'mysql', dataDir: null, baseDir: null };
}

async function isMariaDBRunning() {
  try {
    const mysql = require('mysql2/promise');
    const conn = await withTimeout(
      mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        connectTimeout: 1500
      }),
      3000
    );
    await conn.end();
    return true;
  } catch (e) {
    return false;
  }
}

async function startMariaDB() {
  log('Mengecek MariaDB...');
  const running = await isMariaDBRunning();
  if (running) {
    log('✅ MariaDB sudah berjalan.');
    return true;
  }

  // Dev mode: tidak bisa manage MariaDB embedded
  if (!app.isPackaged) {
    log('⚠️ Dev mode: MariaDB tidak terdeteksi (password=admin). Tapi server tetap akan jalan.');
    return false;
  }

  const paths = getMariaDBPaths();
  if (!fs.existsSync(paths.mysqld)) {
    log('❌ MariaDB tidak ditemukan: ' + paths.mysqld);
    return false;
  }

  // Init data dir jika belum ada
  if (!fs.existsSync(path.join(paths.dataDir, 'mysql'))) {
    log('📦 Inisialisasi MariaDB data directory...');
    try {
      execSync(`"${paths.mysqld}" --initialize-insecure --datadir="${paths.dataDir}"`, { timeout: 30000 });
    } catch (e) {
      const installDb = path.join(paths.baseDir, 'bin', 'mysql_install_db.exe');
      if (fs.existsSync(installDb)) {
        try {
          execSync(`"${installDb}" --datadir="${paths.dataDir}" --password=admin`, { timeout: 30000 });
        } catch (e2) { log('Init DB error: ' + e2.message); }
      }
    }
  }

  // Start MariaDB process
  log('🔄 Menjalankan MariaDB embedded...');
  mariadbProcess = spawn(paths.mysqld, [
    `--datadir=${paths.dataDir}`,
    '--port=3306',
    '--skip-grant-tables',
    '--console'
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  mariadbProcess.stdout.on('data', (d) => log('[MariaDB] ' + d.toString().trim()));
  mariadbProcess.stderr.on('data', (d) => log('[MariaDB] ' + d.toString().trim()));
  mariadbProcess.on('exit', (code) => log('MariaDB exited: ' + code));

  // Tunggu ready max 20 detik
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await isMariaDBRunning()) {
      log('✅ MariaDB siap!');
      await setupDatabase();
      return true;
    }
  }

  log('❌ MariaDB gagal start dalam 20 detik.');
  return false;
}

async function setupDatabase() {
  try {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin'
    });

    try { await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin'"); } catch {}
    await conn.query('CREATE DATABASE IF NOT EXISTS jarfi_db');

    const schemaPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'schema.sql')
      : path.join(__dirname, '..', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      await conn.query('USE jarfi_db');
      for (const stmt of stmts) {
        try { await conn.query(stmt); } catch {}
      }
      log('📄 Schema imported.');
    }

    // Seed admin
    const bcrypt = require('bcryptjs');
    await conn.query('USE jarfi_db');
    const [rows] = await conn.query("SELECT id FROM Users WHERE email = 'admin@jarfi.com'");
    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(
        "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['Super Admin', 'admin@jarfi.com', hash, 'SUPERADMIN']
      );
      log('👤 Admin seeded: admin@jarfi.com / admin123');
    }
    await conn.end();
  } catch (e) {
    log('Setup DB error: ' + e.message);
  }
}

function stopMariaDB() {
  if (mariadbProcess && !mariadbProcess.killed) {
    log('Stopping MariaDB...');
    mariadbProcess.kill();
    mariadbProcess = null;
  }
}

// ═══════════════════════════════════════
//  NEXT.JS SERVER MANAGEMENT
// ═══════════════════════════════════════

function checkServerStatus() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 3000);
    try {
      const req = http.get('http://localhost:3000/', (res) => {
        clearTimeout(timer);
        resolve(true); // Apapun response-nya = server hidup
      });
      req.on('error', () => { clearTimeout(timer); resolve(false); });
      req.on('timeout', () => { clearTimeout(timer); req.destroy(); resolve(false); });
      req.setTimeout(2500);
    } catch (e) {
      clearTimeout(timer);
      resolve(false);
    }
  });
}

async function startServer() {
  // Cek apakah server sudah jalan
  const alreadyRunning = await checkServerStatus();
  if (alreadyRunning) {
    log('✅ Server sudah berjalan di port 3000.');
    return true;
  }

  log('🔄 Memulai server...');

  if (app.isPackaged) {
    const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js');
    if (!fs.existsSync(serverPath)) {
      log('❌ Server tidak ditemukan: ' + serverPath);
      return false;
    }

    const standaloneDir = path.dirname(serverPath);
    const envPath = path.join(standaloneDir, '.env.local');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, [
        'MYSQL_HOST=localhost', 'MYSQL_USER=root',
        'MYSQL_PASSWORD=admin', 'MYSQL_DATABASE=jarfi_db',
        'NEXT_PUBLIC_APP_URL=http://localhost:3000'
      ].join('\n'));
    }

    serverProcess = spawn('node', [serverPath], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: '3000', HOSTNAME: 'localhost', NODE_ENV: 'production',
        MYSQL_HOST: 'localhost', MYSQL_USER: 'root',
        MYSQL_PASSWORD: 'admin', MYSQL_DATABASE: 'jarfi_db'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    serverProcess.stdout.on('data', (d) => log('[Server] ' + d.toString().trim()));
    serverProcess.stderr.on('data', (d) => log('[Server] ' + d.toString().trim()));
  } else {
    // Dev mode: spawn npm run dev
    log('🔄 Menjalankan npm run dev...');
    serverProcess = spawn('npm.cmd', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    serverProcess.stdout.on('data', (d) => log('[Dev] ' + d.toString().trim()));
    serverProcess.stderr.on('data', (d) => log('[Dev] ' + d.toString().trim()));
  }

  if (serverProcess) {
    serverProcess.on('error', (err) => log('Server error: ' + err.message));
    serverProcess.on('exit', (code) => log('Server exited: ' + code));
    log('Server PID: ' + serverProcess.pid);
  }

  return true;
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    log('Stopping server...');
    try { execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' }); } catch {}
    serverProcess = null;
  }
}

// ═══════════════════════════════════════
//  WINDOWS
// ═══════════════════════════════════════

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 500,
    height: 680,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
}

function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });
  mainWindow.loadURL(url).catch(() => {
    log('Gagal memuat dashboard, kembali ke launcher...');
    if (mainWindow) mainWindow.close();
    createSettingsWindow();
  });

  // Setup auto-updater setelah main window siap
  mainWindow.webContents.once('did-finish-load', () => {
    setupAutoUpdater();
  });
}

// ═══════════════════════════════════════
//  IPC HANDLERS
// ═══════════════════════════════════════

ipcMain.handle('check-status', async () => {
  try {
    const [serverOnline, dbOnline] = await withTimeout(
      Promise.all([checkServerStatus(), isMariaDBRunning()]),
      6000
    );
    return { server: serverOnline, database: dbOnline };
  } catch (e) {
    return { server: false, database: false };
  }
});

ipcMain.handle('start-all-services', async () => {
  log('═══ Starting All Services ═══');

  // Step 1: MariaDB
  let dbOk = await isMariaDBRunning();
  if (!dbOk) {
    dbOk = await startMariaDB();
  } else {
    log('✅ MariaDB sudah online.');
  }

  // Step 2: Server — selalu coba start, terlepas dari status DB
  // (Di dev mode, DB mungkin pakai config berbeda tapi server tetap bisa jalan)
  const serverOk = await startServer();

  return { database: dbOk, server: serverOk };
});

ipcMain.on('save-settings', (event, url) => {
  let finalUrl = url.trim();
  if (!finalUrl.startsWith('http')) finalUrl = 'http://' + finalUrl;
  saveConfig({ serverUrl: finalUrl });
  if (settingsWindow) settingsWindow.close();
  createMainWindow(finalUrl);
});

ipcMain.on('close-settings', () => { app.quit(); });
ipcMain.on('restart_app', () => { autoUpdater.quitAndInstall(); });
ipcMain.on('check-for-updates', () => { setupAutoUpdater(); });

// ═══════════════════════════════════════
//  AUTO-UPDATER (GitHub Releases)
// ═══════════════════════════════════════

function setupAutoUpdater() {
  if (!app.isPackaged) {
    log('[Updater] Dilewati di dev mode.');
    return;
  }

  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      log('[Updater] Memeriksa update...');
    });

    autoUpdater.on('update-available', (info) => {
      log('[Updater] Update tersedia: v' + info.version);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', () => {
      log('[Updater] Sudah versi terbaru.');
    });

    autoUpdater.on('download-progress', (progress) => {
      log(`[Updater] Download: ${Math.round(progress.percent)}%`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', progress);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log('[Updater] Update siap diinstall: v' + info.version);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded', info);
      }
    });

    autoUpdater.on('error', (err) => {
      log('[Updater] Error: ' + err.message);
    });

    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    log('[Updater] Setup gagal: ' + err.message);
  }
}

// ═══════════════════════════════════════
//  APP LIFECYCLE
// ═══════════════════════════════════════

app.whenReady().then(() => {
  log('═══ JARFI NOC Starting ═══');
  createSettingsWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  log('═══ JARFI NOC Shutting Down ═══');
  stopServer();
  stopMariaDB();
});
