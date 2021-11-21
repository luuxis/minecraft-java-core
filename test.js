const MCLCore = require('./utils/launch.js');
const minecraft = new MCLCore();
const fs = require('fs');



async function main() {
    let opts = {
        path: "./dev/minecraft",
        version: "1.12.2",
        url: "http://uzurion.luuxis.fr/test/",
        custom: true
    }
    
    minecraft.launch(opts)
}
main()