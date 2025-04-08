import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { spawn } from 'child_process';

// Add isQuitting property to app object for TypeScript
declare global {
  namespace Electron {
    interface App {
      isQuitting: boolean;
    }
  }
}

// Initialize the isQuitting property
app.isQuitting = false;

// Main window reference
let mainWindow: BrowserWindow | null = null;
// Server process reference
let serverProcess: any = null;

/**
 * Create the browser window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../generated-icon.png'),
    show: false,
  });

  // Wait for the server to start before loading the app
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Open DevTools in development mode
      if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Set up IPC handlers
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  // Load the app
  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  // Window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Start the Express server
 */
function startServer() {
  // Path to the server-starter.js file
  const serverPath = path.join(__dirname, '../server-starter.js');
  
  // Check if server file exists
  if (!fs.existsSync(serverPath)) {
    dialog.showErrorBox(
      'Server Error',
      'Server file not found. The application may not function correctly.'
    );
    return;
  }

  // Environment variables for the server process
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ELECTRON_RUN: '1', // Tell the server it's running in Electron
    PORT: '3000',      // Force the server to run on port 3000
    PORTABLE_MODE: 'true', // Enable portable mode
  };
  
  // In portable mode, the database should be in the resources/db directory
  // Next to the executable
  const resourcesPath = process.resourcesPath || path.join(app.getAppPath(), '..', 'resources');
  const dbPath = path.join(resourcesPath, 'db', 'ascend-upsc.db');
  
  // Set database path
  env.SQLITE_DB_PATH = dbPath;
  
  console.log(`Using database at: ${dbPath}`);

  // Spawn the server process
  serverProcess = spawn('node', [serverPath], { env });

  // Handle server stdout
  serverProcess.stdout.on('data', (data: Buffer) => {
    console.log(`Server: ${data.toString()}`);
  });

  // Handle server stderr
  serverProcess.stderr.on('data', (data: Buffer) => {
    console.error(`Server Error: ${data.toString()}`);
  });

  // Handle server exit
  serverProcess.on('close', (code: number) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox(
        'Server Error',
        `The server process exited unexpectedly with code ${code}.`
      );
    }
  });
}

// Initialize app
app.whenReady().then(() => {
  // Start server
  startServer();
  
  // Create window after server starts
  setTimeout(createWindow, 1000);

  // macOS: recreate window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Flag to track if app is explicitly quitting
app.isQuitting = false;

// Clean up before quitting
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Quit when all windows are closed (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

// Ensure the server is stopped when the app is quit
app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});