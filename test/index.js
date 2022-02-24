const { launch, microsoft } = require('../index');
const fs = require('fs');

let save = true;
let client_id = '5a75d2a6-a3c0-4506-9f12-0a557534938a'
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

    let opts = {
        url: "http://launcher.selvania.fr/forge",
        authenticator: mc,
        path: "./.Minecraft",
        version: "1.18.1",
        detached: false,

        java: true,
        args: [],
        custom: true,

        server: {
            ip: "mc.hypixel.net",
            port: 25565,
            autoconnect: false,
        },

        verify: false,
        ignored: ["options.txt", ".fabric", "config", "logs", "ressourcepacks", "shaderpacks", "crash-reports"],

        memory: {
            min: `3G`,
            max: `6G` 
        }
    }

    launch.launch(opts)

    launch.on('progress', (DL, totDL) => {
        console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
    });

    launch.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })


    launch.on('data', (e) => {
        console.log(e)
    })
}
main();

