const {launch, Authenticator} = require('../index');
const launcher = new launch();


let opts = {
    url: "http://uzurion.luuxis.fr/test/",
    authorization: Authenticator.getAuth("username"),
    path: "./minecraft",
    version: "1.12.2",
    ignored: [
        "runtime"
    ],
    verify: true,
    custom: true,
    java: false
}

launcher.launch(opts)

launcher.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});

launcher.on('speed', (speed) => {
    console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
})

launcher.on('launch', () => {
    console.log("[LAUNCH]")
})

launcher.on('close', () => {
    console.log("[CLOSE]")
})