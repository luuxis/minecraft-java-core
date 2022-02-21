const fetch = require('node-fetch');

class skin {

    async SkinChange(data){
        let skin = await fetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'multipart/form-data'
            },
            body: JSON.stringify({
                variant: data.slim ? 'slim' : 'Classic',
                file: data.data_skin
            }),
        }).then(res => res.json());
        if(skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async SkinChangeURL(data){
        let skin = await fetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variant: data.slim ? 'slim' : 'Classic',
                url: data.data_skin
            }),
        }).then(res => res.json());
        if(skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async SkinDelete(data){
        let skin = await fetch("https://api.minecraftservices.com/minecraft/profile/skins/active", {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            }
        }).then(res => res.json());
        if(skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }
    
}
module.exports = new skin;