const { app, BrowserWindow } = require('electron')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  mainWindow.setMenu(null)
  mainWindow.loadFile('app/index.html')
  mainWindow.webContents.openDevTools()
}


app.whenReady().then(() => {
  createWindow();
})
