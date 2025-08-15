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
        url: "http://launcher.luuxis.fr/files?instance=Lost World - The Broken Script",
        path: './minecraft',
        authenticator: mc,
        version: '1.21.1',
        intelEnabledMac: true,
        instance: "Lost World - The Broken Script",

        loader: {
            type: 'neoforge',
            build: '21.1.193',
            enable: true
        },
        memory: {
            min: '2G',
            max: '4G'
        },
        java: {
            path: null,
            version: '24',
            type: 'jre',
        },
    });

    launcher
        .on('progress', (progress, size) => console.log(`[DL] ${((progress / size) * 100).toFixed(2)}%`))
        .on('patch', pacth => process.stdout.write(pacth))
        .on('data', line => process.stdout.write(line))
        .on('error', err => console.error(err))
        .on('close', () => console.log('Game exited.'));
})();
