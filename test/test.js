const launch = require('../index');
const minecraft = new launch.launch();


let opts = {
    path: "./minecraft",
    version: "1.18-pre5",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false,
    java: false
}

minecraft.launch(opts)