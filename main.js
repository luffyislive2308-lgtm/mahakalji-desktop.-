const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require("electron");
const path = require("path");
const Store = require("electron-store");

const APP_URL = "https://mahakalji-overview.replit.app";
const APP_NAME = "Mahakalji";

const store = new Store();
let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  const savedBounds = store.get("windowBounds", { width: 1280, height: 800 });
  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 900, minHeight: 600,
    title: APP_NAME,
    icon: path.join(__dirname, "assets", "icon.ico"),
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    show: false,
  });
  mainWindow.once("ready-to-show", () => { mainWindow.show(); mainWindow.focus(); });
  mainWindow.loadURL(APP_URL);
  mainWindow.on("close", (e) => {
    if (!isQuitting) { store.set("windowBounds", mainWindow.getBounds()); e.preventDefault(); mainWindow.hide(); }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  mainWindow.webContents.on("did-fail-load", () => {
    mainWindow.webContents.loadURL(`data:text/html,<html style="background:#0a0a0a;color:#f97316;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>Cannot connect — check internet</h2><button onclick="location.href='${APP_URL}'" style="padding:10px 24px;background:#f97316;color:#000;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Retry</button></div></html>`);
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.ico"));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Mahakalji", click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: "separator" },
    { label: "Quit", click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on("double-click", () => { mainWindow?.show(); mainWindow?.focus(); });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on("second-instance", () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(() => { Menu.setApplicationMenu(null); createWindow(); createTray(); });
  app.on("before-quit", () => { isQuitting = true; });
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
}
