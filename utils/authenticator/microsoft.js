const fetch = require('node-fetch');

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
    constructor(){
        this.type = type;
    }
    
    async getMicrosoftToken() {
        console.log(this.type);
        
    }
}

let mc = new Microsoft();
mc.getMicrosoftToken();

