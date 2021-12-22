# minecraft-java-core
NodeJS Module for Minecraft launcher</br></br>
<a href="https://www.npmjs.com/package/minecraft-java-core"><img src="https://img.shields.io/npm/v/minecraft-java-core" alt="Version Number"/>

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
const {launch, Authenticator} = require('minecraft-java-core');
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
    url: "http://uzurion.luuxis.fr/1.18/",
    authorization: Authenticator.getAuth("username", "password"),
    path: "./.Minecraft",
    version: "1.18",
    detached: true,

    java: true,
    custom: true,

    verify: true,
    ignored: ["options.txt"],

    memory: {
        min: `1G`,
        max: `1G` 
    }
}
```

### Launching
```javascript
launcher.launch(opts);
```` 