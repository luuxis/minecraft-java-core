const { Launch, Microsoft } = require('minecraft-java-core');
const launcher = new Launch();

const fs = require('fs');
let mc

(async () => {
    if (!fs.existsSync('./account.json')) {
        mc = await new Microsoft().getAuth();
        fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    } else {
        mc = JSON.parse(fs.readFileSync('./account.json'));
        if (!mc.refresh_token) {
            mc = await new Microsoft().getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
        } else {
            mc = await new Microsoft().refresh(mc);
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
            if (mc.error) process.exit(1);
        }
    }

    const opt = {
        url: "https://luuxcraft.fr/api/user/48c74227-13d1-48d6-931b-0f12b73da340/instance",
        path: './minecraft',
        authenticator: mc,
        version: '1.8.9',
        intelEnabledMac: true,
        instance: "Hypixel",

        ignored: [
            "config",
            "logs",
            "resourcepacks",
            "options.txt",
            "optionsof.txt"
        ],

        loader: {
            type: 'forge',
            build: 'latest',
            enable: true
        },
        memory: {
            min: '14G',
            max: '16G'
        },
    };

    launcher.Launch(opt);
    launcher.on('progress', (progress, size) => console.log(`[DL] ${((progress / size) * 100).toFixed(2)}%`));
    launcher.on('patch', pacth => process.stdout.write(pacth));
    launcher.on('data', line => process.stdout.write(line));
    launcher.on('error', err => console.error(err));
})();
