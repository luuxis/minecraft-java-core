/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const nodeFetch = require("node-fetch");
const fs = require('fs');
const FormData = require("form-data");

module.exports = new class skin {
    async SkinChangeUpload(data) {
        const body = new FormData();
        body.append("variant", data.slim ? 'slim' : 'Classic');
        body.append("file", data.data_skin, { contentType: "image/png", filename: "skin.png" });

        let skin = await nodeFetch("https://api.minecraftservices.com/minecraft/profile/skins", {
            method: "POST",
            headers: { 'Authorization': `Bearer ${data.access_token}` },
            body: body,
        }).then(res => res.json());
        if (skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async SkinChangeURL(data) {
        let skin = await nodeFetch("https://api.minecraftservices.com/minecraft/profile/skins", {
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
        if (skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async SkinDelete(data) {
        let skin = await nodeFetch("https://api.minecraftservices.com/minecraft/profile/skins/active", {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${data.access_token}`
            }
        }).then(res => res.json());
        if (skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async CapeChange(data) {
        let skin = await nodeFetch("https://api.minecraftservices.com/minecraft/profile/capes/active", {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                capeId: data.cape_id
            })
        }).then(res => res.json());
        if (skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    async CapeDelete(data) {
        let skin = await nodeFetch("https://api.minecraftservices.com/minecraft/profile/capes/active", {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${data.access_token}`
            }
        }).then(res => res.json());
        if (skin.error) throw (`error: ${skin.errorType}`);
        return skin;
    }

    BufferToBase64(buffer) {
        return fs.readFileSync(buffer, 'base64');
    }

    buffer(buffer) {
        return fs.readFileSync(buffer);
    }

    base64ToBuffer(base64) {
        return Buffer.from(base64, 'base64');
    }
}