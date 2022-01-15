const path = require('path')
const {app, BrowserWindow} = require('electron')

const defaultProperties = {
  width: 1000,
  height: 650,
  resizable: false,
  center: true,
  icon: path.join(__dirname, '../../../assets/icons', `microsoft.${(process.platform === 'win32') ? 'ico' : 'png'}`),
};

module.exports = async function (client_id) {




    let code = await new Promise((resolve) => {
        app.whenReady().then(() => {
            const mainWindow = new BrowserWindow(defaultProperties);
            mainWindow.setMenu(null);
            mainWindow.loadURL(`https://login.live.com/oauth20_authorize.srf?client_id=${client_id}&response_type=code&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=XboxLive.signin%20offline_access`);
            
            mainWindow.webContents.on("did-finish-load", () => {
                const loc = mainWindow.webContents.getURL();
                let interval = null;
                let code;
                interval = setInterval(() => {
                  if(loc.startsWith("https://login.live.com/oauth20_desktop.srf")){
                    clearInterval(interval);
                    try {
                      code = loc.split("code=")[1].split("&")[0];
                    } catch(e){
                      code = "cancel";
                    }
                    mainWindow.close();
                  }
                }, 100);
                
                mainWindow.on('closed', () => {
                  if(!code) code = "cancel";
                  if(interval) clearInterval(interval);
                  resolve(code);
                });
            });
        })
    });
    
    return code
}

