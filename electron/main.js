const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Avoid blank/crash startup if GPU drivers are flaky on some Windows machines
app.disableHardwareAcceleration();

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
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('Failed to load', code, desc, url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    setupIpc();
    createWindow();
    startReminderLoop();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else if (mainWindow) mainWindow.show();
    });
  });
}

app.on('window-all-closed', () => {
  if (reminderInterval) clearInterval(reminderInterval);
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (reminderInterval) clearInterval(reminderInterval);
});
