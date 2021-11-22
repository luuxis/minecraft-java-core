const launch = require('../index');
const launcher = new launch.launch();


let opts = {
    path: "./minecraft",
    version: "1.18-pre5",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false,
    java: false
}

launcher.launch(opts)

launcher.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});

launcher.on('speed', (speed) => {
    //console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
})

launcher.on('launch', () => {
    console.log("[LAUNCH]")
})

launcher.on('close', () => {
    console.log("[CLOSE]")
})