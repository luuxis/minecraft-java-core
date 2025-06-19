const { Launch, Mojang } = require('minecraft-java-core');
const launcher = new Launch();
(async () => {
    await launcher.Launch({
        path: './minecraft',
        authenticator: await Mojang.login('Luuxis'),
        version: '1.16.5',
        intelEnabledMac: true,
        bypassOffline: true,
        loader: {
            path: './',
            type: 'fabric',
            build: 'latest',
            enable: true
        },
        memory: {
            min: '2G',
            max: '4G'
        }
    });

    launcher.on('progress', (progress, size) => console.log(`[DL] ${((progress / size) * 100).toFixed(2)}%`))
        .on('patch', pacth => process.stdout.write(pacth))
        .on('data', line => process.stdout.write(line))
        .on('close', () => console.log('Game exited.'));
})();
