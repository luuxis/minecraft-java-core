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
    var ts = "Cancelled.GUI";
        const mainWindow = new BrowserWindow(defaultProperties);
        mainWindow.setMenu(null);
        mainWindow.loadURL(`https://login.live.com/oauth20_authorize.srf?client_id=${client_id}&response_type=code&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=XboxLive.signin%20offline_access`);
        
        const contents = mainWindow.webContents;
        var loading = false;
        mainWindow.on("close", () => {
            if (!loading) { resolve({ type: "Cancelled", translationString: ts }) };
        });

        contents.on("did-finish-load", () => {
            const loc = contents.getURL();
            if (loc.startsWith(token.redirect)) {
                const urlParams = new URLSearchParams(loc.substr(loc.indexOf("?") + 1)).get("code");
                if (urlParams) {
                    resolve(MSMC.authenticate(urlParams, token, updates));
                    loading = true;
                }
                else {
                    ts = "Cancelled.Back";
                }
                try {
                    mainWindow.close();
                } catch {
                    console.error("[MSMC]: Failed to close window!");
                }
            };
        });
  });

  return code
}

