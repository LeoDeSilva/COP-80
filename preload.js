const { app, BrowserWindow } = require("electron");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  win.loadFile("src/index.html");

  win.on('close', () => {
    console.log(' ---- Bye Bye Electron ---- ')
  });
};

app.whenReady().then(() => {
  createWindow();
})
