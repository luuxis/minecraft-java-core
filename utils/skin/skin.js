const fetch = require('node-fetch');

class skin {
    async skin(access_token, skin_url){
        let profile = await fetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({
                url: skin_url,
                variant: 'Classic'
            }),
        }).then(res => res.json());
        if(profile.error) throw (`error: ${profile.error_description}`);
        return profile;
    }
    
}




module.exports = new skin;