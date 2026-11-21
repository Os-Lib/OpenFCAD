const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let pendingMacOpenFile = null;

function readCadFileAtPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const clean = filePath.trim();
  if (!/\.(dxf|ofcad\.json|json)$/i.test(clean) || !fs.existsSync(clean)) return null;
  try {
    return {
      filePath: clean,
      name: path.basename(clean),
      content: fs.readFileSync(clean, 'utf-8'),
    };
  } catch {
    return null;
  }
}

// macOS Finder double-click file association handler
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  const fileObj = readCadFileAtPath(filePath);
  if (!fileObj) return;
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('open-external-file', fileObj);
  } else {
    pendingMacOpenFile = fileObj;
  }
});

function extractCadFileFromArgs(argv) {
  if (!Array.isArray(argv)) return null;
  for (let i = 1; i < argv.length; i++) {
    const arg = String(argv[i] || '').trim();
    if (!arg || arg.startsWith('-')) continue;
    if (/\.(dxf|ofcad\.json|json)$/i.test(arg) && fs.existsSync(arg)) {
      try {
        const content = fs.readFileSync(arg, 'utf-8');
        return {
          filePath: arg,
          name: path.basename(arg),
          content,
        };
      } catch {
        // Ignore unreadable startup file
      }
    }
  }
  return null;
}

function readInstallerLangInfo() {
  const candidates = [
    path.join(path.dirname(process.execPath), 'installer-lang.json'),
    path.join(__dirname, '..', 'installer-lang.json'),
    path.join(app.getPath('userData'), 'installer-lang.json'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8').trim();
        const parsed = JSON.parse(raw);
        return {
          installerLang: typeof parsed.lang === 'string' ? parsed.lang : null,
          installerLcid: typeof parsed.lcid === 'number' ? parsed.lcid : Number(parsed.lcid) || null,
        };
      }
    } catch {
      // Ignore malformed installer-lang.json
    }
  }
  return { installerLang: null, installerLcid: null };
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const extFile = extractCadFileFromArgs(commandLine);
      if (extFile) {
        mainWindow.webContents.send('open-external-file', extFile);
      }
    }
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#222933',
    title: 'OpenFCAD — CAD 2D/3D',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.argv.includes('--dev') || process.env.VITE_DEV === '1';
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev || !fs.existsSync(distIndex)) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(distIndex);
  }

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window-maximized', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window-maximized', false));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('win-close', () => mainWindow?.close());

ipcMain.handle('get-initial-launch-info', async () => {
  const langInfo = readInstallerLangInfo();
  const startupFile = pendingMacOpenFile || extractCadFileFromArgs(process.argv);
  pendingMacOpenFile = null;
  let osLocale = 'it';
  try {
    osLocale = app.getLocale() || 'it';
  } catch {
    // Fallback
  }
  return {
    ...langInfo,
    osLocale,
    startupFile,
  };
});

ipcMain.handle('dialog-open-file', async (_e, filters) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'Disegni CAD (*.dxf, *.ofcad.json, *.json)', extensions: ['dxf', 'json'] },
      { name: 'Tutti i file', extensions: ['*'] },
    ],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  const filePath = res.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, name: path.basename(filePath), content };
});

ipcMain.handle('dialog-save-file', async (_e, { defaultName, content, filters }) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [
      { name: 'DXF Standard (*.dxf)', extensions: ['dxf'] },
      { name: 'Progetto OpenFCAD (*.ofcad.json)', extensions: ['json'] },
      { name: 'Vettoriale SVG (*.svg)', extensions: ['svg'] },
      { name: 'Modello 3D STL (*.stl)', extensions: ['stl'] },
    ],
  });
  if (res.canceled || !res.filePath) return null;
  fs.writeFileSync(res.filePath, content, 'utf-8');
  return { filePath: res.filePath, name: path.basename(res.filePath) };
});
