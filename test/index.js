const { Microsoft, Launch } = require('../build/Index');
const launch = new Launch();
const fs = require('fs');

let save = true;
let client_id = '13f589e1-e2fc-443e-a68a-63b0092b8eeb'
let mc

async function main() {
    if (save) {
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
                if (mc.error) {
                    mc = await new Microsoft(client_id).getAuth();
                }
                fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
            }
        }
    } else {
        mc = await new Microsoft(client_id).getAuth();
    }

    let opt = {
        // url: 'https://luuxis.fr/api/user/893bbc-a0bc41-da8568-ef56dd-7f2df8/files',
        authenticator: mc,
        timeout: 10000,
        path: './.Minecraft',
        version: '1.16.5',
        instance: 'Aynor',
        detached: false,
        downloadFileMultiple: 300,

        loader: {
            type: 'forge',
            build: 'latest',
            enable: true
        },

        verify: false,
        ignored: ['loader', 'options.txt'],
        args: [],

        javaPath: null,
        java: true,

        screen: {
            width: null,
            height: null,
            fullscreen: null,
        },

        memory: {
            min: '2G',
            max: '4G'
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
}

main()