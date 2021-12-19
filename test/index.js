const {launch, Authenticator} = require('../index');
const login = require('./login');
const launcher = new launch();


let opts = {
    url: "http://146.59.227.140/files/",
    authorization: Authenticator.getAuth(login['E-mail'], login['PassWord']),
    path: "./.Minecraft",
    version: "1.12.2",
    detached: false,

    java: true,
    javapath: "C:/Users/Luuxis/Desktop/Minecraft/Minecraft/runtime/jre-legacy/windows-x64/jre-legacy/bin/java.exe",
    custom: true,

    verify: true,
    ignored: ["options.txt", "servers.dat", "logs"],

    memory: {
        min: `2G`,
        max: `4G` 
    }
}

launcher.launch(opts)

launcher.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});

launcher.on('speed', (speed) => {
    console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
})

launcher.on('data', (e) => {
    console.log(e)
})

// launcher.on('close', () => {
//     console.log("[CLOSE]")
// })