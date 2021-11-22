const MCLCore = require('../utils/launch.js');
const minecraft = new MCLCore();


let opts = {
    path: "./minecraft",
    version: "rd-132211",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false
}

minecraft.launch(opts)