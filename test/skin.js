
const { skin, microsoft } = require('../index');
const fs = require('fs');

let save = true;
let client_id = '5a75d2a6-a3c0-4506-9f12-0a557534938a'
let base64 = fs.readFileSync('./.Minecraft/skin.png', 'base64');
let buffer = Buffer.from(base64, 'base64')
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
        data_skin: buffer, // Your skin url
        slim: false, // true for slim skin, false for classic skin
    }

    console.log(conf)
    console.log(await skin.SkinChangeUpload(conf));
    // console.log(await skin.SkinChangeURL(conf));
    // console.log(await skin.SkinDelete(conf));
}

main();