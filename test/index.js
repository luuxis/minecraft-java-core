const { Launch, Microsoft } = require('../index');
const launch = new Launch();
const fs = require('fs');

let save = true;
let client_id = '5a75d2a6-a3c0-4506-9f12-0a557534938a'
let mc

async function main() {
    if (save) {
        if (!fs.existsSync('./account.json')) {
            mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        } else {
            mc = JSON.parse(fs.readFileSync('./account.json'));
        }

        if (!mc.refresh_token) {
            mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        } else {
            // mc = await new Microsoft(client_id).refresh(mc);
            // fs.writeFileSync('./account.json', JSON.stringify(mc, true, 4));
        }
    } else {
        mc = await new Microsoft(client_id).getAuth();
    }

    let opts = {
        url: null,
        authenticator: mc,
        path: "./.Minecraft",
        version: "1.18.2",
        detached: false,
        java: true,
        args: [],
        custom: false,
        verify: false,
        ignored: ["crash-reports", "logs", "resourcepacks", "resources", "saves", "shaderpacks", "options.txt", "optionsof.txt"],

        memory: {
            min: `1G`,
            max: `2G`
        }
    }

    launch.Launch(opts)

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