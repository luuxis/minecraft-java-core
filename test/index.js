const { launch, microsoft } = require('../index');
const login = require('./login.json');
const Microsoft = new microsoft();
const launcher = new launch();
const fs = require('fs');

async function main() {
    let mc = await Microsoft.refresh(login);
    fs.writeFileSync('login.json', JSON.stringify(mc, true, 4));
    let opts = {
        url: "http://launcher.selvania.fr/files",
        authorization: mc,
        path: "./.Minecraft",
        version: "1.18.1",
        detached: true,

        java: true,
        args: [],
        custom: false,

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

    launcher.launch(opts)

    launcher.on('progress', (DL, totDL) => {
        console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
    });


    // launcher.on('speed', (speed) => {
    //     console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
    // })

    launcher.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })


    launcher.on('data', (e) => {
        console.log(e)
    })

    // launcher.on('close', () => {
    //     console.clear();
    //     console.log("game closed");
    // })
}
main();

