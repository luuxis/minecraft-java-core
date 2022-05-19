'use strict';
// import librairies nodejs
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

//import modules minecraft-java-core
const gameJsonMinecraft = require('./Minecraft-utils/Minecraft-Json');
const gameAssetsMinecraft = require('./Minecraft-utils/Minecraft-Assets');
const gameLibrariesMinecraft = require('./Minecraft-utils/Minecraft-Libraries');
const gameVerifyMinecraft = require('./Minecraft-utils/Minecraft-Verify');
const gameArgumentsMinecraft = require('./Minecraft-utils/Minecraft-Args');
const gameJavaMinecraft = require('./java/Java-json');
const gameDownloadMinecraft = require('./download');

class Launch {
    async GetJsonVersion() {
        let InfoVersion = await new gameJsonMinecraft(this.config.version).GetInfoVersion();
        if (InfoVersion.error) {
            return InfoVersion;
        }
        let json = await fetch(InfoVersion.url).then(res => res.json());
        return { InfoVersion: InfoVersion, json: json };
    }
    
    async Launch(config = {}) {
        // set variables config
        this.config = {
            url: config.url ? config.url : null,
            authenticator: config.authenticator ? config.authenticator : null,
            path: path.resolve(config.path ? config.path : './Minecraft').replace(/\\/g, '/'),
            version: config.version ? config.version : 'latest_release',
            detached: config.detached ? config.detached : false,

            custom: config.custom ? config.custom : false,
            verify: config.verify ? config.verify : false,
            ignored: config.ignored ? config.ignored : [],
            args: config.args ? config.args : [],

            javaPath: config.javaPath ? config.javaPath : null,
            java: config.java ? config.java : false,

            memory: {
                min: config.memory?.min ? config.memory.min : '1G',
                max: config.memory?.max ? config.memory.max : '2G'
            }
        };

        // download files
        let [gameJson, gameAssets, gameLibraries, gameJava] = await this.DownloadGame();
        let args = new gameArgumentsMinecraft(gameJson.json, this.config).GetArgs()
        fs.writeFileSync(`${this.config.path}/test.json`, JSON.stringify(args, null, 4));
    }

    async DownloadGame() {
        let gameJson = await this.GetJsonVersion();
        let gameAssets = await new gameAssetsMinecraft(gameJson.json.assetIndex).Getassets();
        let gameLibraries = await new gameLibrariesMinecraft(gameJson).Getlibraries();
        let gameJava = this.config.java ? await gameJavaMinecraft.GetJsonJava(gameJson.json) : [];
        let Bundle = [...gameLibraries, ...gameAssets.assets, ...gameJava.files ? gameJava.files : []];
        let gameDownloadListe = await new gameVerifyMinecraft(Bundle, this.config).checkBundle();
        
        if (gameDownloadListe.length > 0) {
            let downloader = new gameDownloadMinecraft();
            let totsize = await new gameVerifyMinecraft().getTotalSize(gameDownloadListe);

            downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL);
            });

            downloader.on("speed", (speed) => {
                this.emit("speed", speed);
            });

            downloader.on("estimated", (time) => {
                this.emit("estimated", time);
            });

            await new Promise((ret) => {
                downloader.on("finish", ret);
                downloader.multiple(gameDownloadListe, totsize, 10);
            });
        }
        return [gameJson, gameAssets, gameLibraries, gameJava];
    }

    on(event, func) {
        this[event] = func;
    }

    emit(event, ...args) {
        if (this[event]) this[event](...args);
    }
}
module.exports = Launch;