const { Microsoft, Launch } = require('../build/Index');
const launch = new Launch();
const fs = require('fs');

let client_id = '13f589e1-e2fc-443e-a68a-63b0092b8eeb'
let mc

(async () => {
    if (!fs.existsSync('./account.json')) {
        mc = await new Microsoft(client_id).getAuth();
        fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    } else {
        mc = JSON.parse(fs.readFileSync('./account.json'));
        if (!mc.refresh_token) {
            mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
        } else {
            mc = await new Microsoft(client_id).refresh(mc);
            if (mc.error) mc = await new Microsoft(client_id).getAuth();
            fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
        }
    }

    let opt = {
        url: 'http://launcher.luuxis.fr/files?instance=TEST',
        authenticator: mc,
        timeout: 10000,
        instance: 'test',
        path: './Minecraft',
        version: '1.21',
        detached: false,
        intelEnabledMac: true,
        downloadFileMultiple: 30,

        loader: {
            type: 'neoforge',
            build: 'latest',
            enable: true,
            path: './',
        },

        verify: false,
        ignored: [
            'config',
            'essential',
            'logs',
            'resourcepacks',
            'saves',
            'screenshots',
            'shaderpacks',
            'W-OVERFLOW',
            'options.txt',
            'optionsof.txt'
        ],
        JVM_ARGS: [],
        GAME_ARGS: [],

        java: {
            path: null,
            version: null,
            type: 'jre',
        },

        // screen: {
        //     width: 1500,
        //     height: 900
        // },

        memory: {
            min: '4G',
            max: '6G'
        }
    }

    await launch.Launch(opt);

    launch.on('extract', extract => {
        console.log(extract);
    });

    launch.on('progress', (progress, size, element) => {
        console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('check', (progress, size, element) => {
        console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })

    launch.on('speed', (speed) => {
        console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
    })

    launch.on('patch', patch => {
        console.log(patch);
    });

    launch.on('data', (e) => {
        console.log(e);
    })

    launch.on('close', code => {
        console.log(code);
    });

    launch.on('error', err => {
        console.log(err);
    });
})();
