const fetch = require('node-fetch');

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
        if(id === "") id = "00000000402b5328"
        this.type = type;
        this.id = id;
        
    }

    mojangAuthToken() {
        const token = {
            client_id: this.id,
            redirect: "https://login.live.com/oauth20_desktop.srf"
        }
        return token;
    }

    createLink(token = this.mojangAuthToken()){
        return (
            "https://login.live.com/oauth20_authorize.srf" +
            "?client_id=" +
            token.client_id +
            "&response_type=code" +
            "&redirect_uri=" + encodeURIComponent(token.redirect) +
            "&scope=XboxLive.signin%20offline_access" +
            (token.prompt ? "&prompt=" + token.prompt : "")
        )
    }

    async getAuth(){
        console.log(this.createLink());
    }
    
}
module.exports = Microsoft;

