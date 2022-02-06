const fetch = require('node-fetch');
const os = require('os');
const { microsoft, mojang, launch } = require('minecraft-java-core')
const Launch = new launch()
const Microsoft = new microsoft()
document.querySelector('.ram').max = `${os.totalmem() / 1024 / 1024 / 1024}`
let sel = document.querySelector('.minecraft-version');
let btn_play = document.querySelector('.play');
let btn_mojang = document.querySelector('.mojang');
let btn_microsoft = document.querySelector('.microsoft');
let ram = 1
let authenticator

(async () => {
    let minenecraft_version = (await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json').then(res => res.json())).versions;
    minenecraft_version.forEach(version => {
        var opt = document.createElement("option");
        opt.value = version.id;
        opt.text = version.id;
        sel.add(opt, null);
    });
})()


const disabled = () => {
    btn_microsoft.disabled = true;
    btn_mojang.disabled = true;
    btn_play.disabled = true;
    document.querySelector('.email').disabled = true;
    document.querySelector('.password').disabled = true;
    document.querySelector('.minecraft-version').disabled = true;
    document.querySelector('.ram').disabled = true;
}

const enabled = () => {
    btn_microsoft.disabled = false;
    btn_mojang.disabled = false;
    document.querySelector('.email').disabled = false;
    document.querySelector('.password').disabled = false;
    document.querySelector('.minecraft-version').disabled = false;
    document.querySelector('.ram').disabled = false;
}

document.querySelector('.ram').addEventListener('change', () => {
    let ram = document.querySelector('.ram').value;
    document.querySelector('.ram-text').innerHTML = ram + 'Go';
})

btn_microsoft.addEventListener('click', async () => {
    console.log(JSON.stringify(await Microsoft.getAuth(), true, 4))
    disabled();
})

btn_mojang.addEventListener('click', () => {
    mojang.getAuth('test')
    disabled();
})

btn_play.addEventListener('click', () => {
    let opts = {
        authorization: authenticator,
        path: "./AppData/.minecraft",
        version: sel.value,
        detached: true,
        java: true,
        custom: false,
        verify: false,
        memory: {
            min: `${ram}G`,
            max: `${ram}G`
        }
    }
    
    Launch.launch(opts)
    
    Launch.on('progress', (DL, totDL) => {
        console.log(`Telechargement ${((DL / totDL) * 100).toFixed(0)}%`)
    });
      
    Launch.on('data', (e) => {
        console.log(e)
    })
})



