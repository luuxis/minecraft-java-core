'use strict';
const path = require('path')
const win = nw.Window.get();

const defaultProperties = {
    width: 1000,
    height: 650,
    resizable: false,
    position: "center",
    frame: (process.platform == "win32") ? true : false,
    icon: path.join(__dirname, '../../../assets/icons', `microsoft.png`)
}


class Microsoft {
  async authenticate(){
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
      nw.Window.open("https://login.live.com/oauth20_authorize.srf?client_id=00000000402b5328&response_type=code&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf", defaultProperties, (Window) => {
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

    if(code == "cancel"){
      return {cancel: true};
    }


    // Get tokens
    let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=00000000402b5328&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=service::user.auth.xboxlive.com::MBI_SSL`
    }).then(res => res.json());

    let refresh_date = new Date().getTime() + oauth2.expires_in * 1000;


    let xbl = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: oauth2.access_token
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT"
      })
    }).then(res => res.json());

    let xsts = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [
            xbl.Token
          ]
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT"
      })
    }).then(res => res.json());

    let uhs = xbl.DisplayClaims.xui[0].uhs;


    let mcLogin = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "identityToken": `XBL3.0 x=${uhs};${xsts.Token}` })
    }).then(res => res.json());


    //Check if the player have the game
    let hasGame = await fetch("https://api.minecraftservices.com/entitlements/mcstore", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());


    //Get the profile
    let profile = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());

    const userProfile = {
      access_token: mcLogin.access_token,
      client_token: getUUID(),
      uuid: profile.id,
      name: profile.name,
      meta: {
        xuid: profile.xuid,
        type: "msa",
        demo: profile.demo
      }
    }
    return userProfile
  }

  async refresh(){
    if(new Date().getTime() < acc.refresh_date){
      let profile = await fetch("https://api.minecraftservices.com/minecraft/profile", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${acc.token}`
        }
      }).then(res => res.json());
    }

    let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&client_id=00000000402b5328&scope=service::user.auth.xboxlive.com::MBI_SSL&refresh_token=${acc.refresh_token}`
    }).then(res => res.json());

    let refresh_date = new Date().getTime() + oauth2.expires_in * 1000;
    let xbl = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: oauth2.access_token
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT"
      })
    }).then(res => res.json());

    let xsts = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [
            xbl.Token
          ]
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT"
      })
    }).then(res => res.json());

    let uhs = xbl.DisplayClaims.xui[0].uhs;

    let mcLogin = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "identityToken": `XBL3.0 x=${uhs};${xsts.Token}` })
    }).then(res => res.json());

    let profile = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());
  }
}

function getUUID() {
  var result = ""
  for (var i = 0; i <= 4; i++) {
      result += (Math.floor(Math.random() * 16777216 )+1048576).toString(16);
      if (i < 4)result += "-"
  }
  return result;
}
module.exports = Microsoft;