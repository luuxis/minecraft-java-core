const { Launch, Microsoft } = require('../index');
const launch = new Launch();
const fs = require('fs');

let save = true;
let client_id = ''
let mc

async function main() {
    if (save) {
        if (!fs.existsSync('./account.json')) {
            mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify({ refresh_token: mc.refresh_token }));
        } else {
            mc = JSON.parse(fs.readFileSync('./account.json'));
        }

        if (!mc.refresh_token) {
            mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify({ refresh_token: mc.refresh_token }));
        } else {
            mc = await new Microsoft(client_id).refresh(mc);
            fs.writeFileSync('./account.json', JSON.stringify({ refresh_token: mc.refresh_token }));
        }
    } else {
        mc = await new Microsoft(client_id).getAuth();
    }

    let opts = {
        url: 'https://launcher.selvania.fr/files',
        authenticator: mc,
        path: "./.Minecraft",
        version: "latest_snapshot",
        detached: false,
        java: true,
        args: [],
        custom: true,
        verify: false,
        ignored: ["crash-reports", "logs", "resourcepacks", "resources", "saves", "shaderpacks", "options.txt", "optionsof.txt", 'servers.dat'],

        memory: {
            min: `2G`,
            max: `4G`
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