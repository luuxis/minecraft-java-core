const MCLCore = require('./utils/launch.js');
const minecraft = new MCLCore();


let opts = {
    path: "./dev/minecraft",
    version: "1.18-pre5",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false
}

minecraft.launch(opts)