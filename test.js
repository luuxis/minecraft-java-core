const MCLCore = require('./utils/launch.js');
const minecraft = new MCLCore();
const fs = require('fs');



async function main() {
    let opts = {
        path: "./dev/minecraft",
        version: "1.18-pre5",
        url: "http://uzurion.luuxis.fr/test/",
        custom: true
    }
    
    minecraft.launch(opts)
    console.log(await minecraft.checkFiles());
}
main()