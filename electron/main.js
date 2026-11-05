const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  name: 'streakly-data',
  defaults: {
    habits: [],
    completions: {},
    notes: {},
    settings: {
      theme: 'coral',
      remindersEnabled: true,
      startPage: 0,
    },
  },
});

let mainWindow = null;
let tray = null;
let reminderInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    minWidth: 360,
    minHeight: 640,
    maxWidth: 560,
    backgroundColor: '#1a1a1a',
    title: 'Streakly',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (process.platform === 'win32' && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Streakly');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Streakly',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupIpc() {
  ipcMain.handle('store:get', (_event, key) => store.get(key));
  ipcMain.handle('store:set', (_event, key, value) => {
    store.set(key, value);
    return true;
  });
  ipcMain.handle('store:getAll', () => ({
    habits: store.get('habits'),
    completions: store.get('completions'),
    notes: store.get('notes'),
    settings: store.get('settings'),
  }));
  ipcMain.handle('store:saveAll', (_event, data) => {
    if (data.habits !== undefined) store.set('habits', data.habits);
    if (data.completions !== undefined) store.set('completions', data.completions);
    if (data.notes !== undefined) store.set('notes', data.notes);
    if (data.settings !== undefined) store.set('settings', data.settings);
    return true;
  });

  ipcMain.handle('notify', (_event, { title, body }) => {
    if (Notification.isSupported()) {
      const n = new Notification({ title, body, silent: false });
      n.show();
      return true;
    }
    return false;
  });

  ipcMain.handle('app:platform', () => process.platform);
}

function startReminderLoop() {
  if (reminderInterval) clearInterval(reminderInterval);
  reminderInterval = setInterval(() => {
    const settings = store.get('settings');
    if (!settings?.remindersEnabled) return;
    if (!mainWindow) return;
    mainWindow.webContents.send('check-reminders');
  }, 60 * 1000);
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();
  if (process.platform === 'win32') {
    try {
      createTray();
    } catch (_) {
      /* tray optional */
    }
  }
  startReminderLoop();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow) mainWindow.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (reminderInterval) clearInterval(reminderInterval);
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
