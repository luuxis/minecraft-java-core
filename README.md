# minecraft-java-core
NodeJS Module for Minecraft launcher
<br>
[![Number](https://img.shields.io/npm/v/minecraft-java-core?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)
<br>
[![Install](https://img.shields.io/npm/dm/minecraft-java-core.svg?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)
<br>
[![size](https://img.shields.io/github/languages/code-size/luuxis/minecraft-java-core?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)

---

## Avantages :dizzy:

- Auto check & downloading compatible java version
- Support 100% custom minecraft version
- Work with ftp without any zip file, juste drop folder in your ftp
- Auto check & delete file with bad hash & size

# Install Client

## Quick Start :zap:
```npm
git clone https://github.com/luuxis/Uzurion-Launcher.git
cd Uzurion-Launcher
npm install
npm start
```

## Installation :package:
```npm
npm i minecraft-java-core
```

## Usage :triangular_flag_on_post:
Require library
```javascript
const { launch, mojang } = require('minecraft-java-core');
```

## Launch :rocket:
### Options
```javascript
const { launch, mojang } = require('minecraft-java-core');

let opts = {
    url: "http://launcher.selvania.fr/files",
    authorization: mojang.getAuth('luuxis'),
    path: "./.Minecraft",
    version: "1.18.1",
    detached: false,
    
    java: true,
    args: [],
    custom: true,
    
    server: {
        ip: "mc.hypixel.net",
        port: 25565,
        autoconnect: false,
    },
    
    verify: false,
    ignored: ["options.txt", ".fabric", "config", "logs", "ressourcepacks", "shaderpacks", "crash-reports"],
    
    memory: {
        min: `3G`,
        max: `6G` 
    }
}

launch.launch(opts)

launch.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});

launch.on('speed', (speed) => {
    console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
})

launch.on('estimated', (time) => {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = Math.floor(time - hours * 3600 - minutes * 60);
    console.log(`${hours}h ${minutes}m ${seconds}s`);
})

launch.on('data', (e) => {
    console.log(e)
})

launch.on('close', () => {
    console.clear();
    console.log("game closed");
})
```
