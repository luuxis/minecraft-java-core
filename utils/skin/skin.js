const fetch = require('node-fetch');
const FormData = require("form-data");

class skin {
    async SkinChangeUpload(data){
        const body = new FormData();
        body.append("variant", data.slim ? 'slim' : 'Classic');
        body.append("file", data.data_skin, {contentType: "image/png", filename: "skin.png"});
    
        let skin = await fetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: {'Authorization': `Bearer ${data.access_token}`},
            body: body,
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
                'Authorization': `Bearer ${data.access_token}`
            }
        }).then(res => res.json());
        if(skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }
}
module.exports = new skin;