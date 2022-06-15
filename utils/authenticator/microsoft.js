const nodeFetch = require('node-fetch');

class Microsoft {
    constructor(client_id) {
        if (client_id === "" || !client_id) client_id = "00000000402b5328";
        this.client_id = client_id;

        if (!!process && !!process.versions && !!process.versions.electron) {
            this.type = 'electron';
        } else if (!!process && !!process.versions && !!process.versions.nw) {
            this.type = 'nwjs';
        } else {
            this.type = 'terminal';
        }
    }

    async getAuth(type, url) {
        if (!url) url = `https://login.live.com/oauth20_authorize.srf?client_id=${this.client_id}&response_type=code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=XboxLive.signin%20offline_access&cobrandid=8058f65d-ce06-4c30-9559-473c9275a65d&prompt=select_account`;
        if (!type) type = this.type;

        if (type == "electron") {
            let usercode = await require("./GUI/electron.js")(url)
            if (usercode === "cancel") return false;
            else return await this.url(usercode);
        } else if (type == "nwjs") {
            let usercode = await require("./GUI/nwjs.js")(url)
            if (usercode === "cancel") return false;
            else return await this.url(usercode);
        } else if (type == "terminal") {
            let usercode = await require("./GUI/terminal.js")(url)
            if (usercode === "cancel") return false;
            else return await this.url(usercode);
        }
    }

    async url(code) {
        let oauth2 = await nodeFetch("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${this.client_id}&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf`
        }).then(res => res.json());
        if (oauth2.error) return oauth2;
        return await this.getAccount(oauth2)
    }

    async refresh(acc) {
        let oauth2 = await nodeFetch("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=refresh_token&client_id=${this.client_id}&refresh_token=${acc.refresh_token}`
        }).then(res => res.json());
        if (oauth2.error) return oauth2.error;
        return await this.getAccount(oauth2)
    }

    async getAccount(oauth2) {
        let xbl = await nodeFetch("https://user.auth.xboxlive.com/user/authenticate", {
            method: "post",
            body: JSON.stringify({
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: "d=" + oauth2.access_token
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT"
            }),
            headers: { "Content-Type": "application/json", Accept: "application/json" },
        }).then(res => res.json());
        if (xbl.error) return xbl.error;

        let xsts = await nodeFetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
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
        if (xsts.error) return xsts.error;

        let mcLogin = await nodeFetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ "identityToken": `XBL3.0 x=${xbl.DisplayClaims.xui[0].uhs};${xsts.Token}` })
        }).then(res => res.json());
        if (mcLogin.error) return mcLogin.error;

        let profile = await this.getProfile(mcLogin);

        return {
            access_token: mcLogin.access_token,
            client_token: getUUID(),
            uuid: profile.id,
            name: profile.name,
            refresh_token: oauth2.refresh_token,
            user_properties: '{}',
            meta: {
                type: "Xbox",
                demo: profile.error ? true : false
            },
            profile: {
                skins: profile.skins,
                capes: profile.capes
            }
        }
    }

    async getProfile(mcLogin) {
        let profile = await nodeFetch("https://api.minecraftservices.com/minecraft/profile", {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${mcLogin.access_token}`
            }
        }).then(res => res.json());
        if (profile.error) return profile;
        let skins = profile.skins;
        let capes = profile.capes;

        for(let skin of skins) {
            skin.base64 = await getBuffer(skin.url)
            skin.dataType = 'data:image/png;base64'
        }
        for(let cape of capes) {
            cape.base64 = await getBuffer(cape.url)
            cape.dataType = 'data:image/png;base64'
        }

        return {
            id: profile.id,
            name: profile.name,
            skins: profile.skins,
            capes: profile.capes
        }
    }
}
async function getBuffer(url) {
    let response = await nodeFetch(url);
    let buffer = await response.buffer();
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

function getUUID() {
    var result = ""
    for (var i = 0; i <= 4; i++) {
        result += (Math.floor(Math.random() * 16777216) + 1048576).toString(16);
        if (i < 4) result += "-"
    }
    return result;
}

module.exports = Microsoft;