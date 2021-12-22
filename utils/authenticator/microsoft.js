const fetch = require('node-fetch');
const opn = require('opn');
const electron = require('./GUI/electron.js');


const MICROSOFT_LIVE_LOGIN_URL = 'https://login.live.com';
const MICROSOFT_XBOX_LOGIN_URL = 'https://user.auth.xboxlive.com';
const MICROSOFT_XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com';
const MICROSOFT_OAUTH_REDIRECT_URL ='https://login.microsoftonline.com/common/oauth2/nativeclient';
const MINECRAFT_SERVICES_URL = 'https://api.minecraftservices.com';

let type;
if(!!process && !!process.versions && !!process.versions.electron) {
    type = 'electron';
} else if(!!process && !!process.versions && !!process.versions.nw) {
    type = 'nwjs';
} else {
    type = 'browser';
}

class Microsoft {
    constructor(id = "00000000402b5328"){
        this.type = type;
        this.id = id;
    }
    
    async authMicrosoft(){
        if(this.type === 'electron'){
            return this.authMicrosoftElectron();
        } else if(this.type === 'nwjs'){
            return this.authMicrosoftNWJS();
        } else {
            return this.authMicrosoftBrowser();
        }
    }

    authMicrosoftElectron(){
        console.log(`conexion type: ${this.type}`);
    }

    authMicrosoftNWJS(){
        console.log(`conexion type: ${this.type}`);
    }

    authMicrosoftBrowser(){
        console.log(`conexion type: ${this.type}`);
    }

}

module.exports = Microsoft;
