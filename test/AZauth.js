const { AZauth } = require('../index');
const prompt = require('prompt');

let APIurl = '';
let username = '';
let password = '';

async function main() {
    let azAuth = new AZauth(APIurl);
    let mc = await azAuth.getAuth(username, password);

    if (mc.A2F) {
        console.log('2FA required');
        prompt.start();
        let result = await prompt.get(['2FA code']);
        let code2FA = result['2FA code'];
        mc = await azAuth.getAuth(username, password, code2FA);
    }

    console.log(mc);
}

main();