import { app, BrowserWindow } from 'electron';
import path from 'path';
import { ActivityTracker } from './services/ActivityTracker';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let activityTracker: ActivityTracker | null = null;

const createWindow = () => {
  console.log('Main: Creating window');
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  console.log('Preload path:', path.join(__dirname, 'preload.js'));

  // Load the index.html from a url
  mainWindow.loadURL('http://localhost:5173');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Initialize activity tracker when app is ready
app.whenReady().then(() => {
  console.log('Main: App is ready');
  activityTracker = new ActivityTracker();
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
