const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db;
let SQL;
let dbFilePath;

// ------------------------------------------------------------
// Database setup
// The whole app state (accounts, subjects, class records, etc.)
// is stored as one JSON blob inside a single-row SQLite table.
// This mirrors the app's original in-memory state shape exactly,
// while now persisting to a real .db file on disk permanently.
// ------------------------------------------------------------
async function initDatabase() {
  SQL = await initSqlJs();

  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  dbFilePath = path.join(userDataDir, 'reportcard.db');

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  saveDbToDisk();
}

function saveDbToDisk() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);
}

function loadStateFromDb() {
  const res = db.exec('SELECT data FROM app_state WHERE id = 1');
  if (res.length === 0 || res[0].values.length === 0) return null;
  const json = res[0].values[0][0];
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse stored state:', e);
    return null;
  }
}

function saveStateToDb(stateObj) {
  const json = JSON.stringify(stateObj);
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [json, now]
  );
  saveDbToDisk();
}

// ------------------------------------------------------------
// Window
// ------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 480,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

// ------------------------------------------------------------
// App lifecycle
// ------------------------------------------------------------
app.whenReady().then(async () => {
  await initDatabase();

  ipcMain.handle('db:load', async () => {
    return loadStateFromDb();
  });

  ipcMain.handle('db:save', async (event, stateObj) => {
    try {
      saveStateToDb(stateObj);
      return { ok: true };
    } catch (e) {
      console.error('db:save failed:', e);
      return { ok: false, error: String(e) };
    }
  });

  ipcMain.handle('db:getPath', async () => dbFilePath);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
