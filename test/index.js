const { launch, mojang } = require('../index');
const login = require('./login');
const launcher = new launch();


let opts = {
    url: "http://146.59.227.140/1.7/",
    authorization: mojang.getAuth(login['E-mail'], login['PassWord']),
    path: "./.Minecraft",
    version: "1.7.10",
    detached: true,

    java: true,
    args: [],
    custom: true,

    verify: true,
    ignored: ["options.txt", "logs", "optionsof.txt"],

    memory: {
        min: `2G`,
        max: `4G` 
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