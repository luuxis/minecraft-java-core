# minecraft-java-core
NodeJS Module for Minecraft launcher
<br>
[![Number](https://img.shields.io/npm/v/minecraft-java-core?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)
[![Install](https://img.shields.io/npm/dm/minecraft-java-core.svg?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)
[![size](https://img.shields.io/github/languages/code-size/luuxis/minecraft-java-core?style=social&logo=appveyor)](https://npmjs.com/minecraft-java-core)
[![sizeinstall](https://badgen.net/packagephobia/install/minecraft-java-core)](https://npmjs.com/minecraft-java-core)

<p align="center">
    <a href="http://discord.luuxis.fr">
        <img src="https://invidget.switchblade.xyz/e9q7Yr2cuQ">
    </a>
</p>

---
## Avantages :dizzy:
- Auto check & downloading compatible java version
- Support 100% custom minecraft version
- Work with ftp without any zip file, juste drop folder in your ftp
- Auto check & delete file with bad hash & size

# Install Client

## Quick Start :zap:
```npm
git clone https://github.com/luuxis/Selvania-Launcher.git
cd Selvania-Launcher
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
const { Launch, Mojang } = require('minecraft-java-core');
```

## Launch :rocket:
### Options
```javascript
const { Mojang, Launch } = require('minecraft-java-core');
const launch = new Launch();

async function main() {
    let opt = {
        authenticator: await Mojang.login('Luuxis'),
        timeout: 10000,
        path: './.Minecraft test',
        version: '1.19.3',
        detached: false,
        downloadFileMultiple: 100,

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
```
