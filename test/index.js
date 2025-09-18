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
            if (mc.error) mc = await new Microsoft().getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
        }
    }

    await launcher.Launch({
        url: "https://luuxcraft.fr/api/user/69414f32-4018-4eca-948b-109c46cd119c/instance",
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
    });

    launcher
        .on('progress', (progress, size) => console.log(`[DL] ${((progress / size) * 100).toFixed(2)}%`))
        .on('patch', pacth => process.stdout.write(pacth))
        .on('data', line => process.stdout.write(line))
        .on('error', err => console.error(err))
        .on('close', () => console.log('Game exited.'));
})();
