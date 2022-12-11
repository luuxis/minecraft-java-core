import { Microsoft, Launch } from 'minecraft-java-core';
import fs from 'fs';

const launch = new Launch();

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
                fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
            }
        }
    } else {
        mc = await new Microsoft(client_id).getAuth();
    }

    let opt = {
        url: null,
        authenticator: mc,
        timeout: 10000,
        path: './.Minecraft',
        version: '1.12.2',
        detached: false,
        downloadFileMultiple: 30,

        modde: true,
        loader: {
            type: 'forge',
            build: '1.12.2-14.23.5.2860'
        },

        verify: false,
        ignored: [],
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
}

main()