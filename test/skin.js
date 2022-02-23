const fetch = require("node-fetch");
const mc = require('./account.json')
const fs = require('fs');
const FormData = require("form-data");
let img = fs.readFileSync('./.Minecraft/skin.png')


const APIFetch = async (endpoint, options) => {
    const resp = await fetch(endpoint, options).then(res => res.json());
    console.log(resp);
};

async function makeAuthedRequest(endpoint, options = {}) {
    options.headers = options.headers ?? {};
    options.headers["Authorization"] = "Bearer " + mc.access_token;
    return APIFetch(endpoint, options);
}



async function uploadSkin(imageData, slim) {

    const form = new FormData();
    form.append("variant", slim ? "slim" : "classic");
    form.append("file", imageData, {contentType: "image/png", filename: "skin.png"});

    await makeAuthedRequest("https://api.minecraftservices.com/minecraft/profile/skins", {
        method: "POST",
        body: form
    });
}

async function main(){
    console.log(await uploadSkin(img, false));
}
main()





/**
const { skin, microsoft } = require('../index');
const fs = require('fs');

let save = true;
let client_id = '5a75d2a6-a3c0-4506-9f12-0a557534938a'
let img = fs.readFileSync('./.Minecraft/skin.png', 'base64')
let mc

async function main() {
    if (save) {
        if (!fs.existsSync('./account.json')) {
            mc = await new microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        } else {
            mc = JSON.parse(fs.readFileSync('./account.json'));
        }
        if(!mc.refresh_token){
            mc = await new microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        } else {
            mc = await new microsoft(client_id).refresh(mc);
            fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        }
    } else {
        mc = await new microsoft(client_id).getAuth();
    }


    let conf = {
        access_token: mc.access_token, // Your access token
        data_skin: `${img}`, // Your skin url
        slim: false, // true for slim skin, false for classic skin
    }

    console.log(conf)
    console.log(await skin.SkinChange(conf));
    // console.log(await skin.SkinChangeURL(conf));
    // console.log(await skin.SkinDelete(conf));
}

// main();
 */