import * as path from "path";

import { app, BrowserWindow, Tray, Menu, nativeImage, Notification } from "electron";
import { createIPCHandler } from "electron-trpc/main";
import registerListeners from "./helpers/ipc/listeners-register";
import { router } from "./api";
import { initializeDatabase } from "./api/db/init";

import { logger } from "./helpers/logger";

const inDevelopment: boolean = process.env.NODE_ENV === "development";
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting: boolean = false;

async function createTray() {
  // Request notification permission on macOS
  if (process.platform === "darwin") {
    await app.whenReady();
    if (!Notification.isSupported()) {
      logger.debug("Notifications not supported");
    }
  }

  const iconPath =
    process.platform === "win32"
      ? path.join(__dirname, "../resources/icon.ico")
      : path.join(__dirname, "../resources/icon.png");
  logger.debug("Main: Icon path", iconPath);
  const icon = nativeImage.createFromPath(iconPath);
  // Remove resize for Windows
  if (process.platform === "darwin") {
    icon.resize({ width: 18, height: 18 });
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("iTracksy");

  tray.setTitle("iTracksy");

  tray.on("click", () => {
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow(): void {
  const preload = path.join(__dirname, "preload.js");
  const iconPath = path.join(__dirname, "../resources/icon.ico");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    titleBarStyle: "hidden",
  });

  createIPCHandler({ router, windows: [mainWindow] });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  registerListeners(mainWindow, tray);

  mainWindow.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

// Initialize app when ready
app.whenReady().then(async () => {
  try {
    logger.clearLogFile();
    await initializeDatabase();
  } catch (error) {
    logger.error("[app.whenReady] Failed to initialize database:", error);
  }

  await createTray();
  createWindow();
});

// Handle app quit
app.on("before-quit", () => {
  isQuiting = true;
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
//osX only ends
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Vite
// plugin that tells the Electron app where to look for the Vite-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Preload types
interface ThemeModeContext {
  toggle: () => Promise<boolean>;
  dark: () => Promise<void>;
  light: () => Promise<void>;
  system: () => Promise<boolean>;
  current: () => Promise<"dark" | "light" | "system">;
}
interface ElectronWindow {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  updateTrayTitle: (title: string) => Promise<void>;
  setUserInformation: (params: { userId: string; sessionId?: string }) => Promise<void>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ status: "success" | "error"; message: string }>;
  getLogFileContent: () => Promise<string>;
}

declare global {
  interface Window {
    themeMode: ThemeModeContext;
    electronWindow: ElectronWindow;
  }
}
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

export {};
