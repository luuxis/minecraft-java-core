# minecraft-java-core
NodeJS Module for Minecraft launcher</br></br>
<a href="https://www.npmjs.com/package/minecraft-java-core"><img src="https://img.shields.io/npm/v/minecraft-java-core" alt="Version Number"/>
<a href="https://www.npmjs.com/package/minecraft-java-core"><img src="https://img.shields.io/github/languages/code-size/luuxis/minecraft-java-core" alt="size"/>


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

Create and Init launcher var [launch](utils/launch.js)
```javascript
const launcher = new launch();
```

## Launch :rocket:
### Options
```javascript
const { launch, mojang } = require('minecraft-java-core');
const launcher = new launch();


let opts = {
    url: "http://146.59.227.140/files/",
    authorization: mojang.getAuth('pseudo', 'password'),
    path: "./minecraft",
    version: "1.12.2",
    detached: false,

    java: true,
    args: [],
    custom: false,
    
    server: {
        ip: "127.0.0.1",
        port: 25565,
        autoconnect: false
    },

    verify: true,
    ignored: ["options.txt", "logs", "optionsof.txt"],

    memory: {
        min: `1G`,
        max: `2G` 
    }
}
```

### Launching
```javascript
launcher.launch(opts);
```` 
