const {app, BrowserWindow, ipcMain } = require('electron')
const { microsoft, mojang, launch } = require('minecraft-java-core')
let authenticator


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
      let login = await new microsoft('5a75d2a6-a3c0-4506-9f12-0a557534938a').getAuth()
      if(login){
        event.sender.send("microsoft", "success")
        authenticator = login
      } else {
        event.sender.send("microsoft", "cancel")
      }
    }
})

ipcMain.on("mojang", async (event, data) => {
    if(data.login){
      let login = await mojang.getAuth(data.email, data.password)
      if(login){
        event.sender.send("mojang", "success")
        authenticator = login
      } else {
        event.sender.send("mojang", "cancel")
      }
    }
})

ipcMain.on("play", async (event, data) => {
  let opts = {
    authorization: authenticator,
    path: "./AppData/.minecraft",
    version: data.version,
    detached: true,
    java: true,
    custom: false,
    verify: false,
    memory: {
      min: `${data.ram}G`,
      max: `${data.ram}G`
    }
  }

  launch.launch(opts)
  
  launch.on('progress', (DL, totDL) => {
    console.log(`Telechargement ${((DL / totDL) * 100).toFixed(0)}%`)
  });
  
  launch.on('data', (e) => {
    console.log(e)
  })
})


