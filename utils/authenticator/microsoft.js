const fetch = require('node-fetch');

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
        if (!url) url = `https://login.live.com/oauth20_authorize.srf?client_id=${this.client_id}&response_type=code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=XboxLive.signin%20offline_access&prompt=select_account`;
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
        let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${this.client_id}&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf`
        }).then(res => res.json());
        if (oauth2.error) throw (`error: ${oauth2.error_description}`);

        let xbl = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
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
        if (xbl.error) throw (`error: ${xbl.error_description}`);

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
        if (xsts.error) throw (`error: ${xsts.error_description}`);

        let uhs = xbl.DisplayClaims.xui[0].uhs;
        let mcLogin = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ "identityToken": `XBL3.0 x=${uhs};${xsts.Token}` })
        }).then(res => res.json());
        if (mcLogin.error) throw (`error: ${mcLogin.error_description}`);

        //Get the profile
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
            user_properties: '{}',
            meta: {
                type: "Xbox",
                demo: profile.error ? true : false
            },
            profile: {
                skins: profile.skins,
                cape: profile.capes
            }
        }
    }

    async refresh(acc) {
        let oauth2 = await fetch("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=refresh_token&client_id=${this.client_id}&refresh_token=${acc.refresh_token}`
        }).then(res => res.json());
        if (oauth2.error) throw (`error: ${oauth2.error_description}`);

        let xbl = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
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
        if (xbl.error) throw (`error: ${xbl.error_description}`);

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
        if (xsts.error) throw (`error: ${xsts.error_description}`);

        let uhs = xbl.DisplayClaims.xui[0].uhs;
        let mcLogin = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ "identityToken": `XBL3.0 x=${uhs};${xsts.Token}` })
        }).then(res => res.json());
        if (mcLogin.error) throw (`error: ${mcLogin.error_description}`);

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
            user_properties: '{}',
            meta: {
                type: "Xbox",
                demo: profile.error ? true : false
            },
            profile: {
                skins: profile.skins,
                cape: profile.capes
            }
        }
    }
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