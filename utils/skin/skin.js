const fetch = require('node-fetch');

class skin {

    async skin(data){
        let skin = await fetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variant: data.slim ? 'slim' : 'Classic',
                url: data.skin_url
            }),
        }).then(res => res.json());
        if(skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }
    
}
module.exports = new skin;