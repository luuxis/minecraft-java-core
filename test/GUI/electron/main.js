const { app, BrowserWindow } = require('electron')
const { microsoft } = require('minecraft-java-core');
const Minecraft = new microsoft();

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
  //mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow();
})

async function login() {
  //await Minecraft.getAuth()
  console.log(`conexion successful pseudo: ${(await Minecraft.getAuth()).name}`);
}
login()

