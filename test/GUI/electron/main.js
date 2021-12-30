const { app, BrowserWindow } = require('electron')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  })
  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()
}
app.whenReady().then(() => {

  createWindow();


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
