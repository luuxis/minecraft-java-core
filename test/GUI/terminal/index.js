const {microsoft, launch, mojang } = require('minecraft-java-core');
let client_id = "d877d447-445a-4ab1-ab2f-093e3bf32eb4";
const launcher = new launch();


let opts = {
    url: "http://146.59.227.140/fabric/",
    authorization: mojang.getAuth("E-mail"),
    path: "../../.Minecraft",
    version: "1.18.1",
    detached: true,

    java: true,
    args: [],
    custom: true,

    server: {
        ip: "127.0.0.1",
        port: 25565,
        autoconnect: false
    },

    verify: true,
    ignored: ["options.txt", "logs", "optionsof.txt", "saves"],

    memory: {
        min: `2G`,
        max: `4G` 
    }
}

launcher.launch(opts)

launcher.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});


launcher.on('estimated', (time) => {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = Math.floor(time - hours * 3600 - minutes * 60);
    console.log(`${hours}h ${minutes}m ${seconds}s`);
})


launcher.on('data', (e) => {
    console.log(e)
})