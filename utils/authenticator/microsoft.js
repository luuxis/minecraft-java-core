const fetch = require('node-fetch');

class Microsoft {
  constructor(client_id = "00000000402b5328"){
    this.client_id = "00000000402b5328";
    
    if(!!process && !!process.versions && !!process.versions.electron) {
      this.type = 'electron';
    } else if(!!process && !!process.versions && !!process.versions.nw) {
      this.type = 'nwjs';
    } else {
      this.type = 'terminal';
    }
  }
  
  async getAuth(type, url){
    if(!url) url = `https://login.live.com/oauth20_authorize.srf?client_id=${this.client_id}&response_type=code&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&scope=XboxLive.signin%20offline_access`;
    if(!type) type = this.type;
    
    if(type == "electron"){
      return await this.url(await require("./GUI/electron.js")(url));
    } else if(type == "nwjs"){
      return await this.url(await require("./GUI/nwjs.js")(url));
    } else if (type == "terminal"){
      console.log("terminal is not implemented yet");
    }
  }
  
  async url(code){
    let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=${this.client_id}&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=service::user.auth.xboxlive.com::MBI_SSL`
    }).then(res => res.json());
    
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
    
    if(!hasGame.items.find(i => i.name == "product_minecraft" || i.name == "game_minecraft")){
      this.demo = true;
    } else {
      this.demo = false;
    }
    
    //Get the profile
    let profile = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());

    let refresh_date = new Date().getTime() + oauth2.expires_in * 1000;
    
    return {
      access_token: mcLogin.access_token,
      client_token: getUUID(),
      uuid: profile.id,
      name: profile.name,
      refresh_token: oauth2.refresh_token, 
      refresh_date,
      user_properties: '{}',
      meta: {
        type: "msa",
        demo: this.demo
      }
    }
  }
  
  async refresh(acc){
    let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&client_id=${this.client_id}&scope=service::user.auth.xboxlive.com::MBI_SSL&refresh_token=${acc.refresh_token}`
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

    let hasGame = await fetch("https://api.minecraftservices.com/entitlements/mcstore", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());
    
    if(!hasGame.items.find(i => i.name == "product_minecraft" || i.name == "game_minecraft")){
      this.demo = true;
    } else {
      this.demo = false;
    }
    
    let profile = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${mcLogin.access_token}`
      }
    }).then(res => res.json());

    return {
      access_token: mcLogin.access_token,
      client_token: getUUID(),
      uuid: profile.id,
      name: profile.name,
      refresh_token: oauth2.refresh_token, 
      refresh_date,
      user_properties: '{}',
      meta: {
        type: "msa",
        demo: this.demo
      }
    }
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

