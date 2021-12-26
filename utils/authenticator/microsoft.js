const fetch = require('node-fetch');
const opn = require('opn');

/**
 * metre en place un processus d'authentification avec microsoft pour minecraft
 */



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
    
}
module.exports = Microsoft;

