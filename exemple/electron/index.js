const {app, BrowserWindow, ipcMain } = require('electron')
const { microsoft, mojang, launch, status } = require('minecraft-java-core')
const Launch = new launch()
const Microsoft = new microsoft()


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  })
  mainWindow.webContents.openDevTools()
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

ipcMain.on("microsoft", async (event, data) => {
    if(data === "login"){
        console.log(await Microsoft.getAuth())
    }
})


