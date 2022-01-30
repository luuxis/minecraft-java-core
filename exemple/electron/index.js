const {app, BrowserWindow, ipcMain } = require('electron')


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  })

  mainWindow.setMenu(null);
  mainWindow.loadFile('app/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


