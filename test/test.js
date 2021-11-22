const launch = require('../index');
const minecraft = new launch.launch();


let opts = {
    path: "./minecraft",
    version: "rd-132211",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false,
    java: true
}

minecraft.launch(opts)