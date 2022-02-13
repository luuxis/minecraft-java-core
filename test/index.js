const { launch, microsoft } = require('../index');

async function main() {
    let mc = await new microsoft().getAuth();

    let opts = {
        url: "http://launcher.selvania.fr/forge",
        authorization: mc,
        path: "./.Minecraft",
        version: "1.18.1",
        detached: true,

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

