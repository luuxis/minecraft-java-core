const { skin, microsoft } = require('../index');
const fs = require('fs');

let save = true;
let client_id = '5a75d2a6-a3c0-4506-9f12-0a557534938a'
let skin_url = 'https://cdn.discordapp.com/attachments/877154497233813524/945035875459432548/skin.png';
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

    let profile = await skin.skin(mc.access_token, skin_url);
    console.log(profile);

}
main();