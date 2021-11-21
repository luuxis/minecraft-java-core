const MCLCore = require('./utils/launch.js');
const minecraft = new MCLCore();
const fs = require('fs');



async function main() {
    let opts = {
        path: "./minecraft",
        version: "1.14.4",
        url: "http://uzurion.luuxis.fr/test/",
        custom: true
    }
    
    minecraft.launch(opts)
    fs.writeFileSync(`config.json`, JSON.stringify(await minecraft.checkFiles(), true, 4), 'UTF-8')
    console.log(await minecraft.checkFiles());
}
main()

