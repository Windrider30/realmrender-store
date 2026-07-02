const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;
let appsScriptUrl = '';
let sheetId = '';

function httpsGet(url) {
  return new Promise((resolve) => {
    const follow = (u, redirects) => {
      if (redirects > 5) return resolve({ success: false, message: 'Too many redirects' });
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { resolve({ success: false, message: 'Invalid response' }); }
        });
      }).on('error', (e) => resolve({ success: false, message: e.message }));
    };
    follow(url, 0);
  });
}

ipcMain.handle('load-products', async () => {
  if (!appsScriptUrl) return { success: false, products: [], error: 'No appsScriptUrl in config' };
  const url = appsScriptUrl + '?action=getProducts&sheetId=' + encodeURIComponent(sheetId);
  const result = await httpsGet(url);
  return (result.success && Array.isArray(result.products) && result.products.length > 0)
    ? result
    : { success: false, products: [], error: result.message || 'No products returned' };
});

ipcMain.handle('check-access', async (event, email) => {
  if (!appsScriptUrl) return { success: false, message: 'Not configured' };
  const url = appsScriptUrl + '?action=check&email=' + encodeURIComponent(email) + '&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('load-settings', async () => {
  if (!appsScriptUrl) return { success: false, message: 'No appsScriptUrl in config' };
  const url = appsScriptUrl + '?action=getSettings&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('load-nav', async () => {
  if (!appsScriptUrl) return { success: false, message: 'No appsScriptUrl in config' };
  const url = appsScriptUrl + '?action=getNav&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('load-messages', async (event, board) => {
  if (!appsScriptUrl) return { success: false, messages: [] };
  const url = appsScriptUrl + '?action=getMessages&board=' + encodeURIComponent(board) + '&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('post-message', async (event, board, name, email, message) => {
  if (!appsScriptUrl) return { success: false, message: 'Not configured' };
  const url = appsScriptUrl + '?action=postMessage&board=' + encodeURIComponent(board) +
    '&name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) +
    '&message=' + encodeURIComponent(message) + '&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('delete-message', async (event, msgId) => {
  if (!appsScriptUrl) return { success: false, message: 'Not configured' };
  const url = appsScriptUrl + '?action=deleteMessage&msgId=' + encodeURIComponent(msgId) + '&sheetId=' + encodeURIComponent(sheetId);
  return await httpsGet(url);
});

ipcMain.handle('open-external', (event, url) => {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  shell.openExternal(url);
});

function createWindow() {
  let cfg = {};
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    cfg = raw.realmrender || {};
  } catch(e) {}
  appsScriptUrl = cfg.appsScriptUrl || '';
  sheetId = cfg.sheetId || '';

  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 600,
    title: 'RealmRender — Render Your Reality',
    backgroundColor: '#0D0D0D',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  mainWindow.loadFile('store.html', {
    query: { sheetId: cfg.sheetId || '', appsScriptUrl: cfg.appsScriptUrl || '', emailKey: 'rr_email', favKey: 'rr_favorites' }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      return true;
    }
    return false;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && (input.key === 'I' || input.key === 'i'))) event.preventDefault();
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
