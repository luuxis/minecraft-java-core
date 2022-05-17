const { Launch } = require('../index');
const fs = require('fs');

async function test_json() {
    let a = await new Launch({
        url: "http://launcher.selvania.fr/files",
        path: "./.Minecraft",
        version: "latest_snapshot",
        detached: false,
        java: true,
        args: [],
        custom: false,
        verify: false,
        ignored: ["crash-reports", "logs", "resourcepacks", "resources", "saves", "shaderpacks", "options.txt", "optionsof.txt"],

        memory: {
            min: `1G`,
            max: `2G`
        }
    }).Launch();

    fs.writeFileSync('./test.json', JSON.stringify(a, null, 4));
}
test_json();