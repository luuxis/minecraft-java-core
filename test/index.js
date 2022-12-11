import { Microsoft, Launch } from 'minecraft-java-core';
import fs from 'fs';

const launch = new Launch();

let save = true;
let client_id = '13f589e1-e2fc-443e-a68a-63b0092b8eeb'
let mc

async function main() {
    // if (save) {
    //     if (!fs.existsSync('./account.json')) {
    //         mc = await new Microsoft(client_id).getAuth();
    //         fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    //     } else {
    //         mc = JSON.parse(fs.readFileSync('./account.json'));

    //         if (!mc.refresh_token) {
    //             mc = await new Microsoft(client_id).getAuth();
    //             fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    //         } else {
    //             mc = await new Microsoft(client_id).refresh(mc);
    //             fs.writeFileSync('./account.json', JSON.stringify(mc, null, 4));
    //         }
    //     }
    // } else {
    //     mc = await new Microsoft(client_id).getAuth();
    // }

    let opt = {
        url: null,
        authenticator: null,
        path: './Minecraft',
        version: 'latest_release',
        detached: false,
        downloadFileMultiple: 1,

        modde: false,
        loader: false,

        verify: false,
        ignored: [],
        args: [],

        javaPath: null,
        java: false,

        screen: {
            width: null,
            height: null,
            fullscreen: null,
        },

        memory: {
            min: '1G',
            max: '2G'
        }
    }

    let test = await launch.start(opt)

    console.log(test);
}

main()