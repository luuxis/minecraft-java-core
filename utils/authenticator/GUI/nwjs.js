'use strict';
const path = require('path')
const win = nw.Window.get();

const defaultProperties = {
  width: 1000,
  height: 650,
  resizable: false,
  position: "center",
  frame: (process.platform == "win32") ? true : false,
  icon: path.join(__dirname, '../../../assets/iconsmicrosoft.png')
}

module.exports = async function (client_id) {
  await new Promise((resolve) => {
    win.cookies.getAll({domain: "live.com"}, async (cookies) => {
      for await (let cookie of cookies){
        let url = `http${cookie.secure ? "s" : ""}://${cookie.domain.replace(/$\./, "") + cookie.path}`;
        win.cookies.remove({ url: url, name: cookie.name });
      }
      return resolve();
    });
  });

  let code = await new Promise((resolve) => {
    nw.Window.open(`https://login.live.com/oauth20_authorize.srf?client_id=${client_id}&response_type=code&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=XboxLive.signin%20offline_access`, defaultProperties, (Window) => {
      let interval = null;
      let code;
      interval = setInterval(() => {
        if(Window.window.document.location.href.startsWith("https://login.live.com/oauth20_desktop.srf")){
          clearInterval(interval);
          try {
            code = Window.window.document.location.href.split("code=")[1].split("&")[0];
          } catch(e){
            code = "cancel";
          }
          Window.close();
        }
      }, 100);
      
      Window.on('closed', () => {
        if(!code) code = "cancel";
        if(interval) clearInterval(interval);
        resolve(code);
      });
    });
  });
  return code
}
